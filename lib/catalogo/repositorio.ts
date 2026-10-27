import type { Categoria, Producto, ProductoFiltro } from "./tipos";

/**
 * Interfaz estable de acceso a datos.
 * - Es ASYNC aunque hoy los datos sean locales: el día que haya red/API,
 *   las firmas no cambian (la UI ya hace `await`).
 * - Devuelve tipos de dominio, jamás `Response`, `Row` de BD ni JSON crudo.
 */
export interface CatalogoRepositorio {
  /** Listado con filtros. Devuelve [] si no hay resultados (no lanza). */
  listarProductos(filtro?: ProductoFiltro): Promise<Producto[]>;
  /** Ficha por slug. Devuelve null si no existe (la página decide notFound()). */
  obtenerProductoPorSlug(slug: string): Promise<Producto | null>;
  /** Relacionados para la ficha: misma categoría, excluye el actual. */
  listarRelacionados(slug: string, limite?: number): Promise<Producto[]>;
  /** Todas las categorías (menú de filtros y landing). */
  listarCategorias(): Promise<Categoria[]>;
  /** Total que cumplen el filtro; base para paginación futura. */
  contarProductos(filtro?: ProductoFiltro): Promise<number>;
}
