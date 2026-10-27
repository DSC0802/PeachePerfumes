import type { CatalogoRepositorio } from "./repositorio";
import type { Categoria, Producto, ProductoFiltro } from "./tipos";
import { categorias as categoriasDemo } from "../../data/categorias";
import { productos as productosDemo } from "../../data/productos";

// ÚNICA puerta hacia data/ (docs/arquitectura.md §6.4, regla 2).
// Nada fuera de este archivo puede importar `@/data/*` (bloqueado por ESLint).

/**
 * Devuelve una copia profunda del producto: la UI nunca recibe referencias
 * mutables a los datos de demostración.
 */
function clonarProducto(producto: Producto): Producto {
  return {
    ...producto,
    notas: {
      salida: [...producto.notas.salida],
      corazon: [...producto.notas.corazon],
      fondo: [...producto.notas.fondo],
    },
    imagen: { ...producto.imagen },
  };
}

/** Copia de la categoría, mismo motivo que clonarProducto. */
function clonarCategoria(categoria: Categoria): Categoria {
  return { ...categoria };
}

/** Resuelve el slug de categoría (query ?categoria=) a Categoria.id. */
function categoriaIdPorSlug(slug: string): string | null {
  return categoriasDemo.find((categoria) => categoria.slug === slug)?.id ?? null;
}

/**
 * Filtrado en memoria con la misma semántica que GET /api/v1/productos
 * (docs/api-contracto.md §2.3): categoría, familia olfativa, búsqueda en
 * nombre/marca/notas y orden. Devuelve [] sin lanzar cuando no hay
 * coincidencias, también con valores desconocidos de `categoria` o `familia`.
 */
function aplicarFiltro(productos: Producto[], filtro?: ProductoFiltro): Producto[] {
  let resultado = productos;

  if (filtro?.categoria) {
    const categoriaId = categoriaIdPorSlug(filtro.categoria);
    // Categoría inexistente -> 200 con lista vacía (no es un error).
    resultado =
      categoriaId === null
        ? []
        : resultado.filter((producto) => producto.categoriaId === categoriaId);
  }

  if (filtro?.familia) {
    // Familia desconocida (p. ej. ?familia=loquesea) -> [] : ningún dato la
    // tiene, así que el filtro no vacía nada. Misma semántica que `categoria`.
    const familia = filtro.familia;
    resultado = resultado.filter((producto) => producto.familia === familia);
  }

  if (filtro?.busqueda) {
    const consulta = filtro.busqueda.trim().toLocaleLowerCase("es");
    if (consulta.length > 0) {
      resultado = resultado.filter((producto) =>
        [
          producto.nombre,
          producto.marca,
          ...producto.notas.salida,
          ...producto.notas.corazon,
          ...producto.notas.fondo,
        ]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(consulta),
      );
    }
  }

  switch (filtro?.orden) {
    case "nombre-asc":
      // A→Z en español, ignorando mayúsculas y acentos (decisiones D-DATOS-2).
      resultado = [...resultado].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
      );
      break;
    case "precio-asc":
      resultado = [...resultado].sort((a, b) => a.precio - b.precio);
      break;
    case "precio-desc":
      resultado = [...resultado].sort((a, b) => b.precio - a.precio);
      break;
    case "novedades":
      resultado = resultado.filter((producto) => producto.novedad);
      break;
    case "destacados":
      resultado = resultado.filter((producto) => producto.destacado);
      break;
    default:
      // Sin orden (o valor desconocido procedente de la URL): orden del dato.
      break;
  }

  return resultado;
}

function buscarPorSlug(slug: string): Producto | null {
  return productosDemo.find((producto) => producto.slug === slug) ?? null;
}

export const repositorioDemo: CatalogoRepositorio = {
  async listarProductos(filtro) {
    return aplicarFiltro(productosDemo, filtro).map(clonarProducto);
  },

  async obtenerProductoPorSlug(slug) {
    const producto = buscarPorSlug(slug);
    return producto === null ? null : clonarProducto(producto);
  },

  async listarRelacionados(slug, limite = 4) {
    const actual = buscarPorSlug(slug);
    if (actual === null) return [];
    const maximo = Math.max(0, limite);
    return productosDemo
      .filter(
        (producto) =>
          producto.slug !== slug && producto.categoriaId === actual.categoriaId,
      )
      .slice(0, maximo)
      .map(clonarProducto);
  },

  async listarCategorias() {
    return categoriasDemo.map(clonarCategoria);
  },

  async contarProductos(filtro) {
    return aplicarFiltro(productosDemo, filtro).length;
  },
};
