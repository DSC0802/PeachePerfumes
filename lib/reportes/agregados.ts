/**
 * Agregados de ventas (F3-E, spec 2026-11-05-f3e-reportes-ventas). PUROS.
 * - Una venta es un pedido entregado y cuenta en su fecha de entrega.
 * - Los días se cuentan en hora de Cuba (America/Havana): se trabaja con
 *   «claves de día» (AAAA-MM-DD) para no depender de la zona del servidor.
 */
import { usdACup } from "@/lib/moneda/conversion";
import { formatearNumero } from "@/lib/moneda/formato";

export const ZONA_CUBA = "America/Havana";

const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_CUBA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Instante → «2026-11-05» en hora de Cuba. */
export function claveDia(fecha: Date): string {
  return formatoDia.format(fecha);
}

/* ---------------------------------------------- aritmética de claves de día */

function aUtc(clave: string): number {
  const [a, m, d] = clave.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

function deUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const DIA = 86_400_000;

export function sumarDias(clave: string, dias: number): string {
  return deUtc(aUtc(clave) + dias * DIA);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUtc(hasta) - aUtc(desde)) / DIA);
}

/** Lunes de la semana de la clave (semanas de lunes a domingo). */
export function lunesDe(clave: string): string {
  const diaSemana = (new Date(aUtc(clave)).getUTCDay() + 6) % 7;
  return sumarDias(clave, -diaSemana);
}

/* ------------------------------------------------------------------ períodos */

export const PERIODOS = ["7d", "30d", "mes", "mes-anterior", "personalizado"] as const;
export type ClavePeriodo = (typeof PERIODOS)[number];

export const NOMBRE_PERIODO: Record<ClavePeriodo, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  mes: "Este mes",
  "mes-anterior": "Mes anterior",
  personalizado: "Personalizado",
};

export type Agrupacion = "dia" | "semana" | "mes";

export interface Periodo {
  clave: ClavePeriodo;
  /** Primer día incluido (hora de Cuba). */
  desde: string;
  /** Último día incluido (hora de Cuba). */
  hasta: string;
}

const PATRON_DIA = /^\d{4}-\d{2}-\d{2}$/;

/** Período desde la URL; lo desconocido cae en «últimos 30 días». */
export function resolverPeriodo(
  parametros: { periodo?: string; desde?: string; hasta?: string },
  ahora: Date = new Date(),
): Periodo {
  const hoy = claveDia(ahora);
  const clave = (PERIODOS as readonly string[]).includes(parametros.periodo ?? "")
    ? (parametros.periodo as ClavePeriodo)
    : "30d";
  switch (clave) {
    case "7d":
      return { clave, desde: sumarDias(hoy, -6), hasta: hoy };
    case "mes":
      return { clave, desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
    case "mes-anterior": {
      const primeroDeEste = `${hoy.slice(0, 8)}01`;
      const ultimoAnterior = sumarDias(primeroDeEste, -1);
      return { clave, desde: `${ultimoAnterior.slice(0, 8)}01`, hasta: ultimoAnterior };
    }
    case "personalizado": {
      const desde = PATRON_DIA.test(parametros.desde ?? "") ? parametros.desde! : sumarDias(hoy, -29);
      const hasta = PATRON_DIA.test(parametros.hasta ?? "") ? parametros.hasta! : hoy;
      return desde <= hasta ? { clave, desde, hasta } : { clave, desde: hasta, hasta: desde };
    }
    default:
      return { clave: "30d", desde: sumarDias(hoy, -29), hasta: hoy };
  }
}

/** Agrupación por defecto según la duración (spec §3). */
export function agrupacionPorDefecto(periodo: Periodo): Agrupacion {
  const dias = diasEntre(periodo.desde, periodo.hasta) + 1;
  if (dias <= 31) return "dia";
  if (dias <= 183) return "semana";
  return "mes";
}

/**
 * Rango de instantes para la consulta SQL, ensanchado un día por cada lado:
 * el filtro exacto por día de Cuba se hace después con `claveDia`.
 */
export function rangoConsulta(periodo: Periodo): { desde: Date; hasta: Date } {
  return { desde: new Date(aUtc(periodo.desde) - DIA), hasta: new Date(aUtc(periodo.hasta) + 2 * DIA) };
}

/* -------------------------------------------------------------- agregaciones */

export interface Venta {
  numero: number;
  /** Momento en que se marcó «Entregado». */
  entregadoEn: Date;
  totalUsd: number;
  unidades: number;
  cliente: string;
}

export interface Cubo {
  clave: string;
  etiqueta: string;
  pedidos: number;
  unidades: number;
  totalUsd: number;
}

const centimos = (n: number) => Math.round(n * 100) / 100;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function etiquetaDia(clave: string): string {
  return `${clave.slice(8, 10)}/${clave.slice(5, 7)}`;
}

/** Ventas dentro del período (por día de entrega en Cuba). */
export function ventasDelPeriodo(ventas: Venta[], periodo: Periodo): Venta[] {
  return ventas.filter((v) => {
    const dia = claveDia(v.entregadoEn);
    return dia >= periodo.desde && dia <= periodo.hasta;
  });
}

/** Cubos del período con los huecos a 0. */
export function agruparVentas(ventas: Venta[], periodo: Periodo, agrupacion: Agrupacion): Cubo[] {
  const claveDe = (dia: string) =>
    agrupacion === "dia" ? dia : agrupacion === "semana" ? lunesDe(dia) : dia.slice(0, 7);

  const cubos = new Map<string, Cubo>();
  for (let dia = periodo.desde; dia <= periodo.hasta; dia = sumarDias(dia, 1)) {
    const clave = claveDe(dia);
    if (!cubos.has(clave)) {
      const etiqueta =
        agrupacion === "dia"
          ? etiquetaDia(clave)
          : agrupacion === "semana"
            ? `Sem. ${etiquetaDia(clave)}`
            : `${MESES[Number(clave.slice(5, 7)) - 1]} ${clave.slice(0, 4)}`;
      cubos.set(clave, { clave, etiqueta, pedidos: 0, unidades: 0, totalUsd: 0 });
    }
  }
  for (const venta of ventasDelPeriodo(ventas, periodo)) {
    const cubo = cubos.get(claveDe(claveDia(venta.entregadoEn)));
    if (!cubo) continue;
    cubo.pedidos += 1;
    cubo.unidades += venta.unidades;
    cubo.totalUsd = centimos(cubo.totalUsd + venta.totalUsd);
  }
  return [...cubos.values()];
}

export interface Totales {
  pedidos: number;
  unidades: number;
  totalUsd: number;
  /** Total / pedidos; 0 sin pedidos. */
  ticketMedioUsd: number;
}

export function totales(ventas: Venta[]): Totales {
  const totalUsd = centimos(ventas.reduce((s, v) => s + v.totalUsd, 0));
  return {
    pedidos: ventas.length,
    unidades: ventas.reduce((s, v) => s + v.unidades, 0),
    totalUsd,
    ticketMedioUsd: ventas.length ? centimos(totalUsd / ventas.length) : 0,
  };
}

export interface LineaVendida {
  slug: string;
  nombre: string;
  cantidad: number;
  precioUsd: number;
}

export interface MasVendido {
  slug: string;
  nombre: string;
  unidades: number;
  totalUsd: number;
}

/** Top por unidades (empate: más ingresos, luego nombre). */
export function masVendidos(lineas: LineaVendida[], limite = 10): MasVendido[] {
  const porSlug = new Map<string, MasVendido>();
  for (const l of lineas) {
    const actual = porSlug.get(l.slug) ?? { slug: l.slug, nombre: l.nombre, unidades: 0, totalUsd: 0 };
    actual.unidades += l.cantidad;
    actual.totalUsd = centimos(actual.totalUsd + l.cantidad * l.precioUsd);
    porSlug.set(l.slug, actual);
  }
  return [...porSlug.values()]
    .sort((a, b) => b.unidades - a.unidades || b.totalUsd - a.totalUsd || a.nombre.localeCompare(b.nombre, "es"))
    .slice(0, limite);
}

/* ----------------------------------------------------------------------- CSV */

function celda(v: string | number): string {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV de ventas: un pedido entregado por fila (HU-58). */
export function ventasCsv(ventas: Venta[], tasa: number | null): string {
  const cabecera = ["pedido", "fecha_entrega", "cliente", "articulos", "total_usd", "total_cup_hoy"];
  const filas = ventas.map((v) => [
    v.numero,
    claveDia(v.entregadoEn),
    v.cliente,
    v.unidades,
    v.totalUsd.toFixed(2),
    tasa !== null ? String(usdACup(v.totalUsd, tasa)) : "",
  ]);
  return "﻿" + [cabecera, ...filas].map((f) => f.map(celda).join(";")).join("\r\n") + "\r\n";
}

/** «12 pedidos · 34 unidades» con miles legibles. */
export function resumenRecuento(pedidos: number, unidades: number): string {
  return `${formatearNumero(pedidos)} ${pedidos === 1 ? "pedido" : "pedidos"} · ${formatearNumero(unidades)} ${unidades === 1 ? "unidad" : "unidades"}`;
}
