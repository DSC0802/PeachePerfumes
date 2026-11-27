/**
 * Moneda de la tienda (F3-C2, HU-51/53). Puro: sin BD ni next, lo usan el
 * servidor, el cliente y los tests.
 * - Los precios se guardan en USD (D5); el CUP se calcula al vuelo.
 * - CUP redondeado al peso entero (decisión del cliente, 05/11/2026).
 */

export type MonedaVisible = "USD" | "CUP";

export const NOMBRE_COOKIE_MONEDA = "peache-moneda";
export const SEGUNDOS_COOKIE_MONEDA = 365 * 24 * 60 * 60;

/** Tope de seguridad de la tasa (spec §3): evita errores de tecleo absurdos. */
export const TASA_MAXIMA = 100_000;

/** Valor de la cookie → moneda. Cualquier valor desconocido es USD. */
export function leerPreferencia(valor: string | undefined | null): MonedaVisible {
  return valor === "cup" ? "CUP" : "USD";
}

/** Moneda → valor de la cookie. */
export function valorCookie(moneda: MonedaVisible): "usd" | "cup" {
  return moneda === "CUP" ? "cup" : "usd";
}

/** USD × tasa, redondeado al peso entero. */
export function usdACup(usd: number, cupPorUsd: number): number {
  return Math.round(usd * cupPorUsd);
}

export interface ImporteVisible {
  valor: number;
  moneda: MonedaVisible;
}

/**
 * Qué se pinta para un precio en USD según la preferencia. Sin tasa vigente
 * no hay CUP posible: se queda en USD.
 */
export function importeVisible(
  usd: number,
  preferencia: MonedaVisible,
  cupPorUsd: number | null,
): ImporteVisible {
  if (preferencia === "CUP" && cupPorUsd !== null && cupPorUsd > 0) {
    return { valor: usdACup(usd, cupPorUsd), moneda: "CUP" };
  }
  return { valor: usd, moneda: "USD" };
}

export type ResultadoTasa = { ok: true; tasa: number } | { ok: false; error: string };

/** Valida la tasa tecleada en el panel: número > 0, máx. 2 decimales, ≤ tope. */
export function validarTasa(texto: string): ResultadoTasa {
  const limpio = texto.trim().replace(/\s/g, "").replace(",", ".");
  if (!limpio) return { ok: false, error: "Escribe cuántos CUP vale 1 USD." };
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) {
    return { ok: false, error: "Usa sólo números, con 2 decimales como máximo (p. ej. 325 o 325.50)." };
  }
  const tasa = Number(limpio);
  if (tasa <= 0) return { ok: false, error: "La tasa tiene que ser mayor que 0." };
  if (tasa > TASA_MAXIMA) return { ok: false, error: "La tasa parece demasiado alta. Revísala." };
  return { ok: true, tasa };
}
