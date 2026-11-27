import { describe, expect, it } from "vitest";
import {
  archivoDesdeUrl,
  detectarTipoImagen,
  PATRON_ID_IMAGEN,
} from "@/lib/admin/imagenes";
import {
  altasPorSemana,
  calcularResumen,
  inicioSemana,
  inventarioCsv,
  porcentaje,
  valorInventario,
} from "@/lib/admin/metricas";
import type { ClienteAdmin, ProductoAdmin } from "@/lib/admin/tipos";
import { generarSlug, separarNotas, validarProducto } from "@/lib/admin/validacion-producto";

/** Suite F3-C · dominio del panel admin (puro: sin BD ni disco). */

const CAMPOS_OK = {
  nombre: "Brisa de Coco",
  marca: "Peache",
  slug: "",
  precioUsd: "49.90",
  tamanoMl: "100",
  stock: "12",
  categoriaId: "unisex",
  familia: "frutal",
  estado: "activo",
  descripcion: "Fresca y luminosa.",
  notasSalida: "coco, lima",
  notasCorazon: "",
  notasFondo: "vainilla",
  imagenAlt: "",
};

describe("validarProducto", () => {
  it("acepta un formulario correcto y genera el slug desde el nombre", () => {
    const r = validarProducto(CAMPOS_OK, ["unisex"]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.datos.slug).toBe("brisa-de-coco");
    expect(r.datos.precioUsd).toBe(49.9);
    expect(r.datos.notasSalida).toEqual(["coco", "lima"]);
    expect(r.datos.notasCorazon).toEqual([]);
    expect(r.datos.destacado).toBe(false);
  });

  it("acepta coma decimal en el precio", () => {
    const r = validarProducto({ ...CAMPOS_OK, precioUsd: "49,5" }, ["unisex"]);
    expect(r.ok && r.datos.precioUsd).toBe(49.5);
  });

  it("devuelve un error por cada campo inválido", () => {
    const r = validarProducto(
      {
        ...CAMPOS_OK,
        nombre: " ",
        slug: "Mal Slug",
        precioUsd: "0",
        tamanoMl: "10.5",
        stock: "-1",
        categoriaId: "inventada",
        familia: "metalica",
        estado: "borrador",
        descripcion: "",
        notasSalida: "",
        notasFondo: " , ",
      },
      ["unisex"],
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errores).sort()).toEqual(
      [
        "categoriaId",
        "descripcion",
        "estado",
        "familia",
        "nombre",
        "notasSalida",
        "precioUsd",
        "slug",
        "stock",
        "tamanoMl",
      ].sort(),
    );
  });

  it("rechaza más de 2 decimales en el precio", () => {
    const r = validarProducto({ ...CAMPOS_OK, precioUsd: "10.999" }, ["unisex"]);
    expect(!r.ok && r.errores.precioUsd).toBe("Máximo 2 decimales (p. ej. 49.90).");
  });
});

describe("generarSlug y separarNotas", () => {
  it("quita tildes, signos y espacios", () => {
    expect(generarSlug("  Azahar de Luna — Edición Ñ! ")).toBe("azahar-de-luna-edicion-n");
  });
  it("separa por comas e ignora vacíos", () => {
    expect(separarNotas("bergamota, limón ,, pomelo ")).toEqual(["bergamota", "limón", "pomelo"]);
  });
});

describe("imágenes: magic bytes y nombres", () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
  const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

  it("detecta PNG, JPG y WebP por su cabecera", () => {
    expect(detectarTipoImagen(PNG)).toBe("png");
    expect(detectarTipoImagen(JPG)).toBe("jpg");
    expect(detectarTipoImagen(WEBP)).toBe("webp");
  });

  it("rechaza SVG, GIF, texto y ficheros truncados", () => {
    expect(detectarTipoImagen(new TextEncoder().encode("<svg xmlns='…'>"))).toBeNull();
    expect(detectarTipoImagen(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(detectarTipoImagen(new Uint8Array([0x89, 0x50]))).toBeNull();
    expect(detectarTipoImagen(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20]))).toBeNull();
  });

  it("genera nombres uuid.ext que aceptan el patrón de imagen", () => {
    const nombre = "0f8fad5b-d9cb-469f-a165-70867728950e.webp";
    expect(PATRON_ID_IMAGEN.test("0f8fad5b-d9cb-469f-a165-70867728950e")).toBe(true);
  });

  it("archivoDesdeUrl sólo reconoce imágenes propias (anti path traversal)", () => {
    const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
    expect(archivoDesdeUrl(`/api/imagenes/${id}`)).toBe(id);
    expect(archivoDesdeUrl("/productos/brisa-de-coco.webp")).toBeNull();
    expect(archivoDesdeUrl("/api/imagenes/../.env.local")).toBeNull();
    expect(archivoDesdeUrl("/api/imagenes/..%2F.env.local")).toBeNull();
  });
});

function producto(parcial: Partial<ProductoAdmin>): ProductoAdmin {
  return {
    id: crypto.randomUUID(),
    slug: "p",
    marca: "M",
    nombre: "P",
    tamano: "50 ml",
    tamanoMl: 50,
    precioUsd: 10,
    descripcion: "",
    notasSalida: [],
    notasCorazon: [],
    notasFondo: [],
    imagenSrc: "",
    imagenAlt: "",
    categoriaId: "unisex",
    familia: "floral",
    destacado: false,
    novedad: false,
    estado: "activo",
    oculto: false,
    stock: 10,
    creadoEn: new Date(0),
    actualizadoEn: new Date(0),
    ...parcial,
  };
}

describe("métricas del panel", () => {
  const categorias = [
    { id: "ella", slug: "ella", nombre: "Ella", descripcion: "" },
    { id: "unisex", slug: "unisex", nombre: "Unisex", descripcion: "" },
  ];

  it("valorInventario redondea a céntimos", () => {
    expect(valorInventario({ precioUsd: 19.99, stock: 3 })).toBe(59.97);
  });

  it("porcentaje no divide por cero", () => {
    expect(porcentaje(1, 0)).toBe(0);
    expect(porcentaje(1, 3)).toBe(33);
  });

  it("inicioSemana devuelve el lunes UTC", () => {
    // 2026-11-05 es jueves → lunes 2026-11-02
    expect(inicioSemana(new Date("2026-11-05T15:00:00Z")).toISOString()).toBe("2026-11-02T00:00:00.000Z");
    // domingo 2026-11-08 → mismo lunes
    expect(inicioSemana(new Date("2026-11-08T23:00:00Z")).toISOString()).toBe("2026-11-02T00:00:00.000Z");
  });

  it("altasPorSemana agrupa en 8 cubos y descarta lo antiguo", () => {
    const ahora = new Date("2026-11-05T12:00:00Z");
    const serie = altasPorSemana(
      [new Date("2026-11-03T10:00:00Z"), new Date("2026-11-04T10:00:00Z"), new Date("2026-10-27T10:00:00Z"), new Date("2025-01-01T00:00:00Z")],
      ahora,
    );
    expect(serie).toHaveLength(8);
    expect(serie.at(-1)).toEqual({ etiqueta: "02/11", valor: 2 });
    expect(serie.at(-2)).toEqual({ etiqueta: "26/10", valor: 1 });
    expect(serie.reduce((s, x) => s + x.valor, 0)).toBe(3);
  });

  it("calcularResumen excluye ocultos y descontinuados de lo vendible", () => {
    const productos = [
      producto({ nombre: "A", precioUsd: 100, stock: 2, categoriaId: "ella" }),
      producto({ nombre: "B", precioUsd: 20, stock: 10 }),
      producto({ nombre: "C", precioUsd: 999, stock: 50, oculto: true }),
      producto({ nombre: "D", precioUsd: 999, stock: 50, estado: "descontinuado" }),
      producto({ nombre: "E", precioUsd: 30, stock: 0, estado: "agotado" }),
    ];
    const clientes: ClienteAdmin[] = [
      { id: "1", email: "a@x.cu", nombre: null, telefono: null, rol: "cliente", creadoEn: new Date() },
      { id: "2", email: "adm@x.cu", nombre: null, telefono: null, rol: "admin", creadoEn: new Date() },
    ];
    const r = calcularResumen(productos, categorias, clientes);
    expect(r.totalProductos).toBe(5);
    expect(r.enCatalogo).toBe(3);
    expect(r.ocultos).toBe(1);
    expect(r.valorInventarioUsd).toBe(400);
    expect(r.stockBajo.map((p) => p.nombre)).toEqual(["E", "A"]);
    expect(r.sinStock).toBe(1);
    expect(r.clientes).toBe(1);
    expect(r.porCategoria).toEqual([
      { etiqueta: "Ella", valor: 1 },
      { etiqueta: "Unisex", valor: 2 },
    ]);
    expect(r.porEstado.find((s) => s.etiqueta === "Descontinuado")?.valor).toBe(1);
    expect(r.topValor[0].producto.nombre).toBe("A");
  });

  it("inventarioCsv escapa separadores y neutraliza fórmulas", () => {
    const csv = inventarioCsv(
      [producto({ nombre: 'Rosa; "edición"', marca: "=HYPERLINK(1)" })],
      categorias,
    );
    const [cabecera, fila] = csv.replace("﻿", "").split("\r\n");
    expect(cabecera.startsWith("slug;marca;nombre")).toBe(true);
    expect(fila).toContain(`'=HYPERLINK(1)`);
    expect(fila).toContain(`"Rosa; ""edición"""`);
  });
});
