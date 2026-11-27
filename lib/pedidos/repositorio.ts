/**
 * Pedidos en PostgreSQL (F3-D). Sólo servidor; comparte el pool de identidad.
 * Las cuentas van en USD (spec §1.4): el CUP se calcula al pintar.
 */
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, ne, not, or, sql, type SQL } from "drizzle-orm";
import {
  notificaciones,
  pedidoHistorial,
  pedidoLineas,
  pedidos,
  productos,
  usuarios,
} from "../../db/schema";
import { obtenerBase } from "../auth/base";
import { estaDisponible } from "../catalogo/disponibilidad";
import { esTransicionValida, reservaStock, type EstadoPedido } from "./estados";
import {
  PENDIENTES_MAXIMOS,
  revisarCarrito,
  type LineaCarrito,
  type ProductoActual,
  type ValeRevisado,
} from "./revision";

/* ------------------------------------------------------------------ tipos */

export interface LineaPedido {
  slug: string;
  nombre: string;
  marca: string;
  tamano: string;
  precioUsd: number;
  cantidad: number;
  /** El producto sigue existiendo (para enlazar a su ficha). */
  enCatalogo: boolean;
}

export interface EntradaHistorial {
  estado: EstadoPedido;
  creadoEn: Date;
  /** Email de quien lo cambió; null = el sistema / el propio cliente. */
  autor: string | null;
}

export interface Pedido {
  id: string;
  numero: number;
  estado: EstadoPedido;
  totalUsd: number;
  creadoEn: Date;
  actualizadoEn: Date;
  lineas: LineaPedido[];
  historial: EntradaHistorial[];
  cliente: { id: string; email: string; nombre: string | null; telefono: string | null };
}

export interface ResumenPedido {
  numero: number;
  estado: EstadoPedido;
  totalUsd: number;
  creadoEn: Date;
  articulos: number;
  cliente: { email: string; nombre: string | null };
}

/** Error de negocio al crear o cambiar un pedido (se muestra al usuario). */
export class ErrorPedido extends Error {
  constructor(
    readonly codigo: "carrito_vacio" | "cambios" | "limite_pendientes" | "no_encontrado" | "transicion_invalida",
    readonly vale?: ValeRevisado,
  ) {
    super(codigo);
  }
}

/* ------------------------------------------------------- lectura catálogo */

const visible = and(not(productos.oculto), ne(productos.estado, "descontinuado"));

function aActual(fila: typeof productos.$inferSelect): ProductoActual {
  return {
    slug: fila.slug,
    nombre: fila.nombre,
    marca: fila.marca,
    tamano: fila.tamano,
    precioUsd: Number(fila.precioUsd),
    disponible: estaDisponible(fila),
    stock: fila.stock,
  };
}

/** Estado real de los productos del carrito (para la revisión de /pedido). */
export async function productosActuales(slugs: string[]): Promise<Map<string, ProductoActual>> {
  if (slugs.length === 0) return new Map();
  const filas = await obtenerBase()
    .select()
    .from(productos)
    .where(and(inArray(productos.slug, slugs), visible));
  return new Map(filas.map((f) => [f.slug, aActual(f)]));
}

/* --------------------------------------------------------------- creación */

/**
 * Crea el pedido en UNA transacción (spec §2.3): bloquea las filas de
 * producto, revalida, descuenta stock, guarda pedido + líneas + historial y
 * la notificación del panel. Idempotente por `clave`.
 */
export async function crearPedido(entrada: {
  usuarioId: string;
  lineas: LineaCarrito[];
  clave: string;
}): Promise<{ numero: number; nuevo: boolean }> {
  const db = obtenerBase();

  const existente = await buscarPorClave(entrada.clave, entrada.usuarioId);
  if (existente) return { numero: existente, nuevo: false };

  try {
    return await db.transaction(async (tx) => {
      const [{ pendientes }] = await tx
        .select({ pendientes: count() })
        .from(pedidos)
        .where(and(eq(pedidos.usuarioId, entrada.usuarioId), eq(pedidos.estado, "pendiente")));
      if (pendientes >= PENDIENTES_MAXIMOS) throw new ErrorPedido("limite_pendientes");

      const slugs = [...new Set(entrada.lineas.map((l) => l.slug))];
      if (slugs.length === 0) throw new ErrorPedido("carrito_vacio");

      // Bloqueo de filas: dos pedidos simultáneos no pueden llevarse la misma unidad.
      const filas = await tx
        .select()
        .from(productos)
        .where(and(inArray(productos.slug, slugs), visible))
        .orderBy(asc(productos.slug))
        .for("update");
      const actuales = new Map(filas.map((f) => [f.slug, aActual(f)]));
      const vale = revisarCarrito(entrada.lineas, actuales);
      if (!vale.confirmable) throw new ErrorPedido("carrito_vacio", vale);
      if (vale.conCambios) throw new ErrorPedido("cambios", vale);

      const incluidas = vale.lineas.filter((l) => l.incluida);
      const [pedido] = await tx
        .insert(pedidos)
        .values({
          usuarioId: entrada.usuarioId,
          totalUsd: vale.totalUsd.toFixed(2),
          claveIdempotencia: entrada.clave,
        })
        .returning({ id: pedidos.id, numero: pedidos.numero });

      const idPorSlug = new Map(filas.map((f) => [f.slug, f.id]));
      await tx.insert(pedidoLineas).values(
        incluidas.map((l) => ({
          pedidoId: pedido.id,
          productoId: idPorSlug.get(l.slug) ?? null,
          slug: l.slug,
          nombre: l.nombre,
          marca: l.marca,
          tamano: l.tamano,
          precioUsd: l.precioUsd.toFixed(2),
          cantidad: l.cantidad,
        })),
      );

      // Reserva de stock (decisión del cliente §1.2).
      for (const l of incluidas) {
        await tx
          .update(productos)
          .set({ stock: sql`${productos.stock} - ${l.cantidad}` })
          .where(eq(productos.slug, l.slug));
      }

      await tx.insert(pedidoHistorial).values({ pedidoId: pedido.id, estado: "pendiente", usuarioId: entrada.usuarioId });
      await tx.insert(notificaciones).values({ tipo: "pedido_nuevo", pedidoId: pedido.id });
      return { numero: pedido.numero, nuevo: true };
    });
  } catch (error) {
    // Carrera con la misma clave (doble clic): el otro intento ya lo creó.
    if (String((error as { code?: string }).code) === "23505") {
      const ya = await buscarPorClave(entrada.clave, entrada.usuarioId);
      if (ya) return { numero: ya, nuevo: false };
    }
    throw error;
  }
}

async function buscarPorClave(clave: string, usuarioId: string): Promise<number | null> {
  const [fila] = await obtenerBase()
    .select({ numero: pedidos.numero })
    .from(pedidos)
    .where(and(eq(pedidos.claveIdempotencia, clave), eq(pedidos.usuarioId, usuarioId)))
    .limit(1);
  return fila?.numero ?? null;
}

/* ---------------------------------------------------------------- lectura */

async function cargarPedido(condicion: SQL): Promise<Pedido | null> {
  const db = obtenerBase();
  const [fila] = await db
    .select({ pedido: pedidos, cliente: { id: usuarios.id, email: usuarios.email, nombre: usuarios.nombre, telefono: usuarios.telefono } })
    .from(pedidos)
    .innerJoin(usuarios, eq(pedidos.usuarioId, usuarios.id))
    .where(condicion)
    .limit(1);
  if (!fila) return null;

  const [lineas, historial] = await Promise.all([
    db
      .select({ linea: pedidoLineas, existe: productos.id })
      .from(pedidoLineas)
      .leftJoin(productos, eq(pedidoLineas.productoId, productos.id))
      .where(eq(pedidoLineas.pedidoId, fila.pedido.id))
      .orderBy(asc(pedidoLineas.nombre)),
    db
      .select({ estado: pedidoHistorial.estado, creadoEn: pedidoHistorial.creadoEn, autor: usuarios.email })
      .from(pedidoHistorial)
      .leftJoin(usuarios, eq(pedidoHistorial.usuarioId, usuarios.id))
      .where(eq(pedidoHistorial.pedidoId, fila.pedido.id))
      .orderBy(asc(pedidoHistorial.creadoEn)),
  ]);

  return {
    id: fila.pedido.id,
    numero: fila.pedido.numero,
    estado: fila.pedido.estado,
    totalUsd: Number(fila.pedido.totalUsd),
    creadoEn: fila.pedido.creadoEn,
    actualizadoEn: fila.pedido.actualizadoEn,
    cliente: fila.cliente,
    lineas: lineas.map(({ linea, existe }) => ({
      slug: linea.slug,
      nombre: linea.nombre,
      marca: linea.marca,
      tamano: linea.tamano,
      precioUsd: Number(linea.precioUsd),
      cantidad: linea.cantidad,
      enCatalogo: existe !== null,
    })),
    historial: historial.map((h) => ({ estado: h.estado, creadoEn: h.creadoEn, autor: h.autor })),
  };
}

/** Pedido de un cliente: nunca devuelve pedidos ajenos (spec §2.5). */
export function obtenerPedidoDeUsuario(numero: number, usuarioId: string): Promise<Pedido | null> {
  if (!Number.isInteger(numero) || numero < 1) return Promise.resolve(null);
  return cargarPedido(and(eq(pedidos.numero, numero), eq(pedidos.usuarioId, usuarioId)) as SQL);
}

/** Cualquier pedido (sólo panel). */
export function obtenerPedidoAdmin(numero: number): Promise<Pedido | null> {
  if (!Number.isInteger(numero) || numero < 1) return Promise.resolve(null);
  return cargarPedido(eq(pedidos.numero, numero));
}

export interface FiltroPedidos {
  usuarioId?: string;
  estado?: EstadoPedido;
  desde?: Date;
  /** Exclusivo: pedidos anteriores a esta fecha. */
  hasta?: Date;
  /** Email, nombre o número. */
  q?: string;
}

export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<ResumenPedido[]> {
  const condiciones: SQL[] = [];
  if (filtro.usuarioId) condiciones.push(eq(pedidos.usuarioId, filtro.usuarioId));
  if (filtro.estado) condiciones.push(eq(pedidos.estado, filtro.estado));
  if (filtro.desde) condiciones.push(gte(pedidos.creadoEn, filtro.desde));
  if (filtro.hasta) condiciones.push(lt(pedidos.creadoEn, filtro.hasta));
  const q = filtro.q?.trim();
  if (q) {
    const patron = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const numero = Number(q.replace(/^n[º°o]?\s*/i, ""));
    const busqueda = or(
      ilike(usuarios.email, patron),
      ilike(usuarios.nombre, patron),
      Number.isInteger(numero) && numero > 0 ? eq(pedidos.numero, numero) : undefined,
    );
    if (busqueda) condiciones.push(busqueda);
  }

  const filas = await obtenerBase()
    .select({
      numero: pedidos.numero,
      estado: pedidos.estado,
      totalUsd: pedidos.totalUsd,
      creadoEn: pedidos.creadoEn,
      email: usuarios.email,
      nombre: usuarios.nombre,
      articulos: sql<number>`(select coalesce(sum(${pedidoLineas.cantidad}), 0)::int from ${pedidoLineas} where ${pedidoLineas.pedidoId} = ${pedidos.id})`,
    })
    .from(pedidos)
    .innerJoin(usuarios, eq(pedidos.usuarioId, usuarios.id))
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(pedidos.creadoEn));

  return filas.map((f) => ({
    numero: f.numero,
    estado: f.estado,
    totalUsd: Number(f.totalUsd),
    creadoEn: f.creadoEn,
    articulos: Number(f.articulos),
    cliente: { email: f.email, nombre: f.nombre },
  }));
}

export async function contarPedidos(estado: EstadoPedido, usuarioId?: string): Promise<number> {
  const [fila] = await obtenerBase()
    .select({ total: count() })
    .from(pedidos)
    .where(usuarioId ? and(eq(pedidos.estado, estado), eq(pedidos.usuarioId, usuarioId)) : eq(pedidos.estado, estado));
  return fila?.total ?? 0;
}

/* ---------------------------------------------------------- cambio estado */

/**
 * Cambia el estado (sólo transiciones válidas, spec §3). Cancelar un pedido
 * que reservaba stock lo devuelve (decisión del cliente §1.2).
 */
export async function cambiarEstadoPedido(numero: number, hacia: EstadoPedido, adminId: string): Promise<void> {
  await obtenerBase().transaction(async (tx) => {
    const [pedido] = await tx.select().from(pedidos).where(eq(pedidos.numero, numero)).limit(1).for("update");
    if (!pedido) throw new ErrorPedido("no_encontrado");
    if (!esTransicionValida(pedido.estado, hacia)) throw new ErrorPedido("transicion_invalida");

    if (hacia === "cancelado" && reservaStock(pedido.estado)) {
      const lineas = await tx.select().from(pedidoLineas).where(eq(pedidoLineas.pedidoId, pedido.id));
      for (const l of lineas) {
        if (!l.productoId) continue;
        await tx
          .update(productos)
          .set({ stock: sql`${productos.stock} + ${l.cantidad}` })
          .where(eq(productos.id, l.productoId));
      }
    }

    await tx.update(pedidos).set({ estado: hacia, actualizadoEn: new Date() }).where(eq(pedidos.id, pedido.id));
    await tx.insert(pedidoHistorial).values({ pedidoId: pedido.id, estado: hacia, usuarioId: adminId });
  });
}

/* --------------------------------------------------------- notificaciones */

export interface Notificacion {
  id: string;
  leida: boolean;
  creadaEn: Date;
  numeroPedido: number | null;
  totalUsd: number | null;
  cliente: string | null;
}

export async function listarNotificaciones(limite = 50): Promise<Notificacion[]> {
  const filas = await obtenerBase()
    .select({
      id: notificaciones.id,
      leida: notificaciones.leida,
      creadaEn: notificaciones.creadaEn,
      numeroPedido: pedidos.numero,
      totalUsd: pedidos.totalUsd,
      email: usuarios.email,
      nombre: usuarios.nombre,
    })
    .from(notificaciones)
    .leftJoin(pedidos, eq(notificaciones.pedidoId, pedidos.id))
    .leftJoin(usuarios, eq(pedidos.usuarioId, usuarios.id))
    .orderBy(desc(notificaciones.creadaEn))
    .limit(limite);
  return filas.map((f) => ({
    id: f.id,
    leida: f.leida,
    creadaEn: f.creadaEn,
    numeroPedido: f.numeroPedido,
    totalUsd: f.totalUsd === null ? null : Number(f.totalUsd),
    cliente: f.nombre ?? f.email,
  }));
}

export async function contarNoLeidas(): Promise<number> {
  try {
    const [fila] = await obtenerBase().select({ total: count() }).from(notificaciones).where(eq(notificaciones.leida, false));
    return fila?.total ?? 0;
  } catch {
    return 0;
  }
}

export async function marcarNotificacion(id: string, leida: boolean): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await obtenerBase().update(notificaciones).set({ leida }).where(eq(notificaciones.id, id));
}

export async function marcarTodasLeidas(): Promise<void> {
  await obtenerBase().update(notificaciones).set({ leida: true }).where(eq(notificaciones.leida, false));
}
