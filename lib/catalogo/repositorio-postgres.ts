import { and, eq, ne, not } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  categorias as tablaCategorias,
  productos as tablaProductos,
} from "../../db/schema";
import { estaDisponible } from "./disponibilidad";
import { aplicarFiltro, seleccionarRelacionados } from "./filtro";
import type { CatalogoRepositorio } from "./repositorio";
import type { Categoria, Producto, ProductoFiltro } from "./tipos";

type FilaProducto = typeof tablaProductos.$inferSelect;
type FilaCategoria = typeof tablaCategorias.$inferSelect;

// Pool perezoso por proceso: Next (y vitest) crean el módulo varias veces en
// desarrollo; un pool evita agotar conexiones con la recarga en caliente.
let pool: Pool | null = null;

function obtenerBase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL en .env.local: la tienda no puede leer el catálogo (spec F3-A §7).",
    );
  }
  pool ??= new Pool({ connectionString: url, max: 5 });
  return drizzle(pool); // el tipo se infiere: `drizzle` está sobrecargado
}

/** Fila → dominio. Jamás se expone un Row de BD fuera de este archivo. */
function aProducto(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    slug: fila.slug,
    marca: fila.marca,
    nombre: fila.nombre,
    tamano: fila.tamano,
    tamanoMl: fila.tamanoMl,
    // numeric(10,2) llega como string desde pg.
    precio: Number(fila.precioUsd),
    moneda: "USD",
    descripcion: fila.descripcion,
    notas: {
      salida: [...fila.notasSalida],
      corazon: [...fila.notasCorazon],
      fondo: [...fila.notasFondo],
    },
    imagen: { src: fila.imagenSrc, alt: fila.imagenAlt },
    categoriaId: fila.categoriaId,
    familia: fila.familia,
    destacado: fila.destacado,
    novedad: fila.novedad,
    // F3-C2 (decisión del cliente): agotado si el admin lo marca o si no hay stock.
    disponible: estaDisponible(fila),
  };
}

function aCategoria(fila: FilaCategoria): Categoria {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
  };
}

/**
 * Lo que la tienda puede ver (F3-C2, HU-26/27): no oculto (HU-23) y no
 * descontinuado. Los agotados SÍ se ven, con `disponible: false`.
 */
const condicionVisible = and(not(tablaProductos.oculto), ne(tablaProductos.estado, "descontinuado"));

/** Todo lo visible en la tienda. */
async function cargarVisibles(): Promise<{
  productos: Producto[];
  categorias: Categoria[];
}> {
  const db = obtenerBase();
  const [filasProductos, filasCategorias] = await Promise.all([
    db.select().from(tablaProductos).where(condicionVisible),
    db.select().from(tablaCategorias),
  ]);
  return {
    productos: filasProductos.map(aProducto),
    categorias: filasCategorias.map(aCategoria),
  };
}

async function listarProductosInterno(filtro?: ProductoFiltro): Promise<Producto[]> {
  const { productos, categorias } = await cargarVisibles();
  return aplicarFiltro(productos, categorias, filtro);
}

export const repositorioPostgres: CatalogoRepositorio = {
  listarProductos: listarProductosInterno,

  async contarProductos(filtro) {
    return (await listarProductosInterno(filtro)).length;
  },

  async obtenerProductoPorSlug(slug) {
    const db = obtenerBase();
    const [fila] = await db
      .select()
      .from(tablaProductos)
      .where(and(eq(tablaProductos.slug, slug), condicionVisible))
      .limit(1);
    return fila === undefined ? null : aProducto(fila);
  },

  async listarRelacionados(slug, limite) {
    const { productos } = await cargarVisibles();
    return seleccionarRelacionados(productos, slug, limite);
  },

  async listarCategorias() {
    const db = obtenerBase();
    const filas = await db.select().from(tablaCategorias);
    return filas.map(aCategoria);
  },
};
