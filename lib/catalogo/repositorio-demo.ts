import type { CatalogoRepositorio } from "./repositorio";
import type { Categoria, Producto } from "./tipos";
import { categorias as categoriasDemo } from "../../data/categorias";
import { productos as datosDemo } from "../../data/productos";
import { aplicarFiltro, seleccionarRelacionados } from "./filtro";

// Puerta de la app hacia data/ (junto con db/seed.ts, script de desarrollo; la UI nunca importa data/).
// Nada fuera de este archivo puede importar `@/data/*` (bloqueado por ESLint).

/**
 * Devuelve una copia profunda del producto: la UI nunca recibe referencias
 * mutables a los datos de demostración.
 */
// Demo (F3-C2): sin stock en data/, todo producto demo está disponible.
const productosDemo: Producto[] = datosDemo.map((producto) => ({ ...producto, disponible: true }));

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

function buscarPorSlug(slug: string): Producto | null {
  return productosDemo.find((producto) => producto.slug === slug) ?? null;
}

export const repositorioDemo: CatalogoRepositorio = {
  async listarProductos(filtro) {
    return aplicarFiltro(productosDemo, categoriasDemo, filtro).map(clonarProducto);
  },

  async obtenerProductoPorSlug(slug) {
    const producto = buscarPorSlug(slug);
    return producto === null ? null : clonarProducto(producto);
  },

  async listarRelacionados(slug, limite) {
    return seleccionarRelacionados(productosDemo, slug, limite).map(clonarProducto);
  },

  async listarCategorias() {
    return categoriasDemo.map(clonarCategoria);
  },

  async contarProductos(filtro) {
    return aplicarFiltro(productosDemo, categoriasDemo, filtro).length;
  },

  async obtenerProductoConMasStock() {
    const conStock = productosDemo.filter((p) => p.stock > 0).sort((a, b) => b.stock - a.stock);
    return conStock.length > 0 ? clonarProducto(conStock[0]) : null;
  },
};
