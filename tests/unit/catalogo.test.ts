import { describe, expect, it } from "vitest";
import {
  catalogo,
  type FamiliaOlfativa,
  type OrdenCatalogo,
} from "@/lib/catalogo";

/**
 * Tests unitarios puros del repositorio de catálogo en modo demo
 * (decisión D8). Se consumen SIEMPRE como lo haría la UI: a través del
 * punto de entrada `@/lib/catalogo` — nunca importando `@/data/*`
 * (frontera de abstracción, docs/arquitectura.md §6).
 *
 * Cobertura: filtrado por `categoria`/`familia`/`busqueda`, los 5 valores
 * de `orden` (incluido `nombre-asc` con `localeCompare("es")`),
 * `contarProductos === listarProductos.length` y devolución de copias
 * (inmutabilidad de la fuente de datos).
 */

describe("filtrado por categoria", () => {
  it("devuelve sólo los productos de la categoría indicada", async () => {
    const productos = await catalogo.listarProductos({ categoria: "mujer" });
    expect(productos.length).toBeGreaterThan(0);
    for (const producto of productos) {
      expect(producto.categoriaId).toBe("mujer");
    }
  });

  it("una categoría inexistente devuelve [] (no lanza)", async () => {
    await expect(
      catalogo.listarProductos({ categoria: "no-existe" }),
    ).resolves.toEqual([]);
  });
});

describe("filtrado por familia olfativa", () => {
  it("familia=floral devuelve exactamente 4 productos", async () => {
    const productos = await catalogo.listarProductos({ familia: "floral" });
    expect(productos).toHaveLength(4);
    for (const producto of productos) {
      expect(producto.familia).toBe("floral");
    }
  });

  it("una familia desconocida devuelve [] (semántica de ?familia=loquesea)", async () => {
    const familiaDesconocida = "loquesea" as FamiliaOlfativa;
    await expect(
      catalogo.listarProductos({ familia: familiaDesconocida }),
    ).resolves.toEqual([]);
  });

  it("combina familia con categoría", async () => {
    const productos = await catalogo.listarProductos({
      familia: "floral",
      categoria: "hombre",
    });
    expect(productos).toEqual([]);
  });
});

describe("búsqueda (busqueda)", () => {
  it("encuentra por nombre", async () => {
    const productos = await catalogo.listarProductos({ busqueda: "brisa" });
    expect(productos.map((producto) => producto.slug)).toEqual([
      "brisa-de-coco-100",
    ]);
  });

  it("ignora mayúsculas y espacios sobrantes", async () => {
    const conMayusculas = await catalogo.listarProductos({
      busqueda: "BRISA",
    });
    const conEspacios = await catalogo.listarProductos({
      busqueda: "   brisa   ",
    });
    expect(conMayusculas).toHaveLength(1);
    expect(conEspacios.map((producto) => producto.slug)).toEqual([
      "brisa-de-coco-100",
    ]);
  });

  it("encuentra por marca", async () => {
    const productos = await catalogo.listarProductos({
      busqueda: "casa palma",
    });
    expect(productos).toHaveLength(3);
    for (const producto of productos) {
      expect(producto.marca).toBe("Casa Palma");
    }
  });

  it("encuentra por nota de la pirámide olfativa", async () => {
    const productos = await catalogo.listarProductos({ busqueda: "lichi" });
    expect(productos.map((producto) => producto.slug)).toEqual([
      "rosa-de-batey",
    ]);
  });

  it("sin coincidencias devuelve [] (no lanza)", async () => {
    await expect(
      catalogo.listarProductos({ busqueda: "zzzz-no-existe" }),
    ).resolves.toEqual([]);
  });

  it("una búsqueda en blanco no filtra nada", async () => {
    const total = await catalogo.contarProductos();
    await expect(
      catalogo.listarProductos({ busqueda: "   " }),
    ).resolves.toHaveLength(total);
  });
});

describe("ordenación (los 5 valores de OrdenCatalogo)", () => {
  it("destacados: sólo productos con destacado=true", async () => {
    const productos = await catalogo.listarProductos({ orden: "destacados" });
    expect(productos.length).toBeGreaterThan(0);
    expect(productos.every((producto) => producto.destacado)).toBe(true);
    // No pierde productos indebidamente: el subconjunto está dentro del total.
    expect(productos.length).toBeLessThan(await catalogo.contarProductos());
  });

  it("novedades: sólo productos con novedad=true", async () => {
    const productos = await catalogo.listarProductos({ orden: "novedades" });
    expect(productos.length).toBeGreaterThan(0);
    expect(productos.every((producto) => producto.novedad)).toBe(true);
    expect(productos.length).toBeLessThan(await catalogo.contarProductos());
  });

  it("nombre-asc: orden A→Z en español con localeCompare('es')", async () => {
    const productos = await catalogo.listarProductos({ orden: "nombre-asc" });
    const total = await catalogo.contarProductos();
    expect(productos).toHaveLength(total);

    // Invariante: cada par consecutivo no decrece con la colación en español.
    for (let i = 1; i < productos.length; i++) {
      const anterior = productos[i - 1].nombre;
      const actual = productos[i].nombre;
      expect(
        anterior.localeCompare(actual, "es", { sensitivity: "base" }),
        `"${anterior}" debe ir antes que "${actual}"`,
      ).toBeLessThanOrEqual(0);
    }

    // Concreciones que un orden por código de unidad NO cumpliría
    // (las tildes/acentos no son ASCII: Á y É ordenarían al final):
    const posiciones = new Map(
      productos.map((producto, indice) => [producto.nombre, indice]),
    );
    const posicion = (nombre: string) => posiciones.get(nombre)!;
    expect(posicion("Ámbar Real")).toBeLessThan(posicion("Brisa de Coco"));
    expect(posicion("Duna")).toBeLessThan(posicion("Ébano"));
    expect(posicion("Ébano")).toBeLessThan(posicion("Manglar"));
    expect(posicion("Café de Siesta")).toBeLessThan(posicion("Cedro Nocturno"));
  });

  it("precio-asc: precios no decrecientes sin perder productos", async () => {
    const productos = await catalogo.listarProductos({ orden: "precio-asc" });
    expect(productos).toHaveLength(await catalogo.contarProductos());
    for (let i = 1; i < productos.length; i++) {
      expect(productos[i - 1].precio).toBeLessThanOrEqual(productos[i].precio);
    }
    expect(productos[0].nombre).toBe("Rosa de Batey"); // 1350 CUP
    expect(productos[productos.length - 1].nombre).toBe("Ébano"); // 4500 CUP
  });

  it("precio-desc: precios no crecientes sin perder productos", async () => {
    const productos = await catalogo.listarProductos({ orden: "precio-desc" });
    expect(productos).toHaveLength(await catalogo.contarProductos());
    for (let i = 1; i < productos.length; i++) {
      expect(productos[i - 1].precio).toBeGreaterThanOrEqual(productos[i].precio);
    }
    expect(productos[0].nombre).toBe("Ébano");
    expect(productos[productos.length - 1].nombre).toBe("Rosa de Batey");
  });

  it("sin orden devuelve el orden del dato; un valor desconocido, idem", async () => {
    const sinOrden = (await catalogo.listarProductos()).map(
      (producto) => producto.slug,
    );
    // El primer elemento del archivo de datos es Brisa de Coco (orden del dato).
    expect(sinOrden[0]).toBe("brisa-de-coco-100");

    const desconocido = (
      await catalogo.listarProductos({
        orden: "inventado" as OrdenCatalogo,
      })
    ).map((producto) => producto.slug);
    expect(desconocido).toEqual(sinOrden);
  });
});

describe("contarProductos", () => {
  it("coincide siempre con listarProductos(...).length", async () => {
    const filtros = [
      undefined,
      { categoria: "mujer" },
      { categoria: "hombre" },
      { familia: "floral" },
      { familia: "oriental" },
      { busqueda: "casa palma" },
      { busqueda: "zzzz-no-existe" },
      { orden: "destacados" },
      { orden: "precio-asc" },
      { familia: "floral", categoria: "mujer", orden: "nombre-asc" },
    ] as const;

    for (const filtro of filtros) {
      const listado = await catalogo.listarProductos(filtro);
      const conteo = await catalogo.contarProductos(filtro);
      expect(conteo, `filtro ${JSON.stringify(filtro)}`).toBe(listado.length);
    }
  });
});

describe("inmutabilidad (devolución de copias)", () => {
  it("mutar el resultado no afecta a la fuente de datos", async () => {
    const slugsMujerPrevios = (await catalogo.listarProductos({
      categoria: "mujer",
    })).map((producto) => producto.slug);
    const totalPrevio = await catalogo.contarProductos({ categoria: "mujer" });

    const primera = await catalogo.listarProductos({ categoria: "mujer" });
    const nombrePrevio = primera[0].nombre;
    const notasPrevias = [...primera[0].notas.salida];
    const imagenPrevia = primera[0].imagen.src;

    // Mutación agresiva de la copia: objeto, arrays internos e imagen.
    primera[0].nombre = "PRODUCTO MUTADO";
    primera[0].notas.salida.push("nota intrusa");
    primera[0].imagen.src = "/mutado.webp";
    primera.reverse();

    const segunda = await catalogo.listarProductos({ categoria: "mujer" });
    expect(segunda[0].nombre).toBe(nombrePrevio);
    expect(segunda[0].notas.salida).toEqual(notasPrevias);
    expect(segunda[0].imagen.src).toBe(imagenPrevia);
    expect(segunda.map((producto) => producto.slug)).toEqual(slugsMujerPrevios);
    expect(await catalogo.contarProductos({ categoria: "mujer" })).toBe(
      totalPrevio,
    );
  });

  it("cada llamada devuelve arrays y objetos nuevos", async () => {
    const a = await catalogo.listarProductos();
    const b = await catalogo.listarProductos();
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
    expect(a[0].notas).not.toBe(b[0].notas);
    expect(a[0].notas.salida).not.toBe(b[0].notas.salida);
  });

  it("obtenerProductoPorSlug devuelve una copia aislada", async () => {
    const previo = await catalogo.obtenerProductoPorSlug("brisa-de-coco-100");
    expect(previo).not.toBeNull();
    const notasPrevias = [...previo!.notas.fondo];

    const copia = await catalogo.obtenerProductoPorSlug("brisa-de-coco-100");
    copia!.nombre = "PRODUCTO MUTADO";
    copia!.notas.fondo.push("nota intrusa");

    const otraVez = await catalogo.obtenerProductoPorSlug("brisa-de-coco-100");
    expect(otraVez!.nombre).toBe("Brisa de Coco");
    expect(otraVez!.notas.fondo).toEqual(notasPrevias);
  });

  it("listarCategorias devuelve copias de las categorías", async () => {
    const previas = await catalogo.listarCategorias();
    const nombrePrevio = previas[0].nombre;
    previas[0].nombre = "CATEGORÍA MUTADA";

    const despues = await catalogo.listarCategorias();
    expect(despues[0].nombre).toBe(nombrePrevio);
  });
});

describe("consultas puntuales del repositorio", () => {
  it("obtenerProductoPorSlug devuelve null para un slug inexistente", async () => {
    await expect(
      catalogo.obtenerProductoPorSlug("no-existe"),
    ).resolves.toBeNull();
    await expect(
      catalogo.obtenerProductoPorSlug("brisa-de-coco-100"),
    ).resolves.toMatchObject({ slug: "brisa-de-coco-100" });
  });

  it("listarRelacionados comparte categoría, excluye el actual y respeta el límite", async () => {
    const relacionados = await catalogo.listarRelacionados(
      "brisa-de-coco-100",
    );
    expect(relacionados.length).toBeGreaterThan(0);
    expect(relacionados.length).toBeLessThanOrEqual(4);
    for (const producto of relacionados) {
      expect(producto.slug).not.toBe("brisa-de-coco-100");
      expect(producto.categoriaId).toBe("mujer");
    }

    const limitado = await catalogo.listarRelacionados(
      "brisa-de-coco-100",
      2,
    );
    expect(limitado).toHaveLength(2);

    await expect(
      catalogo.listarRelacionados("no-existe"),
    ).resolves.toEqual([]);
  });
});
