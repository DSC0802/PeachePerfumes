/**
 * Acceso a datos del panel admin (F3-C). Sólo servidor.
 * Comparte el pool de identidad (`lib/auth/base.ts`): el panel siempre
 * requiere sesión admin, así que ya depende de esa conexión.
 * Jamás se expone una fila de BD ni `password_hash` fuera de este archivo.
 */
import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import {
  categorias as tablaCategorias,
  productos as tablaProductos,
  usuarios as tablaUsuarios,
} from "../../db/schema";
import { obtenerBase } from "../auth/base";
import type { Categoria } from "../catalogo/tipos";
import type {
  ClienteAdmin,
  EntradaProducto,
  EstadoProducto,
  ProductoAdmin,
} from "./tipos";

type FilaProducto = typeof tablaProductos.$inferSelect;

function aProductoAdmin(fila: FilaProducto): ProductoAdmin {
  return {
    id: fila.id,
    slug: fila.slug,
    marca: fila.marca,
    nombre: fila.nombre,
    tamano: fila.tamano,
    tamanoMl: fila.tamanoMl,
    precioUsd: Number(fila.precioUsd), // numeric llega como string
    descripcion: fila.descripcion,
    notasSalida: [...fila.notasSalida],
    notasCorazon: [...fila.notasCorazon],
    notasFondo: [...fila.notasFondo],
    imagenSrc: fila.imagenSrc,
    imagenAlt: fila.imagenAlt,
    categoriaId: fila.categoriaId,
    familia: fila.familia,
    destacado: fila.destacado,
    novedad: fila.novedad,
    estado: fila.estado,
    oculto: fila.oculto,
    stock: fila.stock,
    creadoEn: fila.creadoEn,
    actualizadoEn: fila.actualizadoEn,
  };
}

/** Entrada validada → columnas. `imagenSrc` se pasa aparte. */
function aColumnas(entrada: EntradaProducto) {
  return {
    slug: entrada.slug,
    marca: entrada.marca,
    nombre: entrada.nombre,
    tamano: `${entrada.tamanoMl} ml`,
    tamanoMl: entrada.tamanoMl,
    precioUsd: entrada.precioUsd.toFixed(2),
    descripcion: entrada.descripcion,
    notasSalida: entrada.notasSalida,
    notasCorazon: entrada.notasCorazon,
    notasFondo: entrada.notasFondo,
    imagenAlt: entrada.imagenAlt,
    categoriaId: entrada.categoriaId,
    familia: entrada.familia,
    destacado: entrada.destacado,
    novedad: entrada.novedad,
    estado: entrada.estado,
    stock: entrada.stock,
  };
}

export interface FiltroAdmin {
  q?: string;
  estado?: EstadoProducto;
  incluirOcultos?: boolean;
}

export async function listarProductosAdmin(filtro: FiltroAdmin = {}): Promise<ProductoAdmin[]> {
  const condiciones: SQL[] = [];
  if (!filtro.incluirOcultos) condiciones.push(eq(tablaProductos.oculto, false));
  if (filtro.estado) condiciones.push(eq(tablaProductos.estado, filtro.estado));
  const q = filtro.q?.trim();
  if (q) {
    const patron = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const busqueda = or(
      ilike(tablaProductos.nombre, patron),
      ilike(tablaProductos.marca, patron),
      ilike(tablaProductos.slug, patron),
    );
    if (busqueda) condiciones.push(busqueda);
  }
  const filas = await obtenerBase()
    .select()
    .from(tablaProductos)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(asc(tablaProductos.nombre));
  return filas.map(aProductoAdmin);
}

export async function obtenerProductoAdmin(id: string): Promise<ProductoAdmin | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [fila] = await obtenerBase()
    .select()
    .from(tablaProductos)
    .where(eq(tablaProductos.id, id))
    .limit(1);
  return fila ? aProductoAdmin(fila) : null;
}

export async function slugEnUso(slug: string, exceptoId?: string): Promise<boolean> {
  const [fila] = await obtenerBase()
    .select({ id: tablaProductos.id })
    .from(tablaProductos)
    .where(eq(tablaProductos.slug, slug))
    .limit(1);
  return Boolean(fila && fila.id !== exceptoId);
}

/** Alta. `oculto: true` lo crea fuera de la tienda (p. ej. para revisarlo antes). */
export async function crearProducto(
  entrada: EntradaProducto,
  imagenSrc: string,
  { oculto = false }: { oculto?: boolean } = {},
): Promise<ProductoAdmin> {
  const [fila] = await obtenerBase()
    .insert(tablaProductos)
    .values({ ...aColumnas(entrada), imagenSrc, oculto })
    .returning();
  return aProductoAdmin(fila);
}

export async function actualizarProducto(
  id: string,
  entrada: EntradaProducto,
  imagenSrc?: string,
): Promise<ProductoAdmin | null> {
  const [fila] = await obtenerBase()
    .update(tablaProductos)
    .set({
      ...aColumnas(entrada),
      ...(imagenSrc !== undefined ? { imagenSrc } : {}),
      actualizadoEn: new Date(),
    })
    .where(eq(tablaProductos.id, id))
    .returning();
  return fila ? aProductoAdmin(fila) : null;
}

/** HU-23: «Eliminar» del panel = ocultar; se puede restaurar. */
export async function establecerOculto(id: string, oculto: boolean): Promise<ProductoAdmin | null> {
  const [fila] = await obtenerBase()
    .update(tablaProductos)
    .set({ oculto, actualizadoEn: new Date() })
    .where(eq(tablaProductos.id, id))
    .returning();
  return fila ? aProductoAdmin(fila) : null;
}

export async function cambiarEstado(id: string, estado: EstadoProducto): Promise<ProductoAdmin | null> {
  const [fila] = await obtenerBase()
    .update(tablaProductos)
    .set({ estado, actualizadoEn: new Date() })
    .where(eq(tablaProductos.id, id))
    .returning();
  return fila ? aProductoAdmin(fila) : null;
}

export async function listarCategoriasAdmin(): Promise<Categoria[]> {
  const filas = await obtenerBase()
    .select()
    .from(tablaCategorias)
    .orderBy(asc(tablaCategorias.nombre));
  return filas.map((f) => ({ id: f.id, slug: f.slug, nombre: f.nombre, descripcion: f.descripcion }));
}

/** Cuentas registradas, más recientes primero. Selección explícita: nunca el hash. */
export async function listarClientes(): Promise<ClienteAdmin[]> {
  return obtenerBase()
    .select({
      id: tablaUsuarios.id,
      email: tablaUsuarios.email,
      nombre: tablaUsuarios.nombre,
      telefono: tablaUsuarios.telefono,
      rol: tablaUsuarios.rol,
      creadoEn: tablaUsuarios.creadoEn,
    })
    .from(tablaUsuarios)
    .orderBy(desc(tablaUsuarios.creadoEn));
}

