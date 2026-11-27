/**
 * Lecturas de ventas en PostgreSQL (F3-E). Sólo servidor; comparte el pool
 * de identidad. Todo sale de pedidos / pedido_lineas / pedido_historial.
 */
import { and, count, eq, gte, inArray, lt, sum } from "drizzle-orm";
import { pedidoHistorial, pedidoLineas, pedidos, usuarios } from "../../db/schema";
import { obtenerBase } from "../auth/base";
import type { EstadoPedido } from "../pedidos/estados";
import type { LineaVendida, Venta } from "./agregados";

/** Pedidos entregados cuya entrega cae en el rango (instantes). */
export async function ventasEntregadas(rango: { desde: Date; hasta: Date }): Promise<{
  ventas: Venta[];
  lineas: (LineaVendida & { numero: number; entregadoEn: Date })[];
}> {
  const db = obtenerBase();
  const filas = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      totalUsd: pedidos.totalUsd,
      entregadoEn: pedidoHistorial.creadoEn,
      email: usuarios.email,
    })
    .from(pedidos)
    .innerJoin(
      pedidoHistorial,
      and(eq(pedidoHistorial.pedidoId, pedidos.id), eq(pedidoHistorial.estado, "entregado")),
    )
    .innerJoin(usuarios, eq(pedidos.usuarioId, usuarios.id))
    .where(
      and(
        eq(pedidos.estado, "entregado"),
        gte(pedidoHistorial.creadoEn, rango.desde),
        lt(pedidoHistorial.creadoEn, rango.hasta),
      ),
    );
  if (filas.length === 0) return { ventas: [], lineas: [] };

  const lineas = await db
    .select({
      pedidoId: pedidoLineas.pedidoId,
      slug: pedidoLineas.slug,
      nombre: pedidoLineas.nombre,
      cantidad: pedidoLineas.cantidad,
      precioUsd: pedidoLineas.precioUsd,
    })
    .from(pedidoLineas)
    .where(inArray(pedidoLineas.pedidoId, filas.map((f) => f.id)));

  const unidadesPorPedido = new Map<string, number>();
  for (const l of lineas) unidadesPorPedido.set(l.pedidoId, (unidadesPorPedido.get(l.pedidoId) ?? 0) + l.cantidad);
  const porId = new Map(filas.map((f) => [f.id, f]));

  return {
    ventas: filas.map((f) => ({
      numero: f.numero,
      entregadoEn: f.entregadoEn,
      totalUsd: Number(f.totalUsd),
      unidades: unidadesPorPedido.get(f.id) ?? 0,
      cliente: f.email,
    })),
    lineas: lineas.map((l) => ({
      slug: l.slug,
      nombre: l.nombre,
      cantidad: l.cantidad,
      precioUsd: Number(l.precioUsd),
      numero: porId.get(l.pedidoId)!.numero,
      entregadoEn: porId.get(l.pedidoId)!.entregadoEn,
    })),
  };
}

export interface RecuentoEstado {
  pedidos: number;
  totalUsd: number;
}

/** Cobrado / pendiente de cobro / cancelado (HU-57). Sin rango = todos los pedidos. */
export async function recuentoPorEstado(rango?: { desde: Date; hasta: Date }): Promise<{
  cobrado: RecuentoEstado;
  porCobrar: RecuentoEstado;
  cancelado: RecuentoEstado;
  sinConfirmar: number;
}> {
  const filas = await obtenerBase()
    .select({ estado: pedidos.estado, pedidos: count(), total: sum(pedidos.totalUsd) })
    .from(pedidos)
    .where(rango ? and(gte(pedidos.creadoEn, rango.desde), lt(pedidos.creadoEn, rango.hasta)) : undefined)
    .groupBy(pedidos.estado);

  const vacio = (): RecuentoEstado => ({ pedidos: 0, totalUsd: 0 });
  const resultado = { cobrado: vacio(), porCobrar: vacio(), cancelado: vacio(), sinConfirmar: 0 };
  for (const f of filas) {
    const estado = f.estado as EstadoPedido;
    const destino =
      estado === "entregado" ? resultado.cobrado : estado === "cancelado" ? resultado.cancelado : resultado.porCobrar;
    destino.pedidos += f.pedidos;
    destino.totalUsd = Math.round((destino.totalUsd + Number(f.total ?? 0)) * 100) / 100;
    if (estado === "pendiente") resultado.sinConfirmar = f.pedidos;
  }
  return resultado;
}
