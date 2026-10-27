import type { CatalogoRepositorio } from "./repositorio";
import type { Categoria, Producto } from "./tipos";
import { categorias as categoriasDemo } from "../../data/categorias";
import { productos as productosDemo } from "../../data/productos";
import { aplicarFiltro, seleccionarRelacionados } from "./filtro";

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
};
