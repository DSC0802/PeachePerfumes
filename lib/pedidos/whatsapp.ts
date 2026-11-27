/**
 * Vale de WhatsApp (F3-D, decisión del cliente §1.5): el cliente abre su
 * WhatsApp con el pedido ya escrito y dirigido al número de la tienda.
 * Puro: sin BD ni next.
 */
import { usdACup } from "@/lib/moneda/conversion";
import { formatearImporte } from "@/lib/moneda/formato";

/** Número de la tienda en formato internacional, sólo dígitos (lo que pide wa.me). */
export function normalizarNumero(texto: string): string {
  return texto.replace(/[^\d]/g, "");
}

export type ResultadoNumero = { ok: true; numero: string } | { ok: false; error: string };

/** 8–15 dígitos (E.164 sin «+»). Ej.: 5355551234. */
export function validarNumero(texto: string): ResultadoNumero {
  const numero = normalizarNumero(texto);
  if (!numero) return { ok: false, error: "Escribe el número de WhatsApp de la tienda." };
  if (numero.length < 8 || numero.length > 15) {
    return {
      ok: false,
      error: "Escríbelo en formato internacional, con el código del país (p. ej. 53 5555 1234).",
    };
  }
  return { ok: true, numero };
}

export interface DatosVale {
  numeroPedido: number;
  cliente: string;
  lineas: { cantidad: number; nombre: string; tamano: string; precioUsd: number }[];
  totalUsd: number;
  /** Tasa vigente; null = sin CUP. */
  tasa: number | null;
  urlPedido: string;
}

export function formatearNumeroPedido(numero: number): string {
  return `Nº ${String(numero).padStart(4, "0")}`;
}

/** Texto del vale tal y como llega al WhatsApp de la tienda. */
export function textoVale(datos: DatosVale): string {
  const lineas = datos.lineas.map(
    (l) => `${l.cantidad} × ${l.nombre} (${l.tamano}) — ${formatearImporte(l.precioUsd * l.cantidad, "USD")}`,
  );
  const equivalente =
    datos.tasa !== null ? ` (≈ ${formatearImporte(usdACup(datos.totalUsd, datos.tasa), "CUP")} al cambio de hoy)` : "";
  return [
    `Hola, soy ${datos.cliente}. Te envío mi pedido ${formatearNumeroPedido(datos.numeroPedido)} de Peache Perfumes:`,
    ...lineas,
    `Total: ${formatearImporte(datos.totalUsd, "USD")}${equivalente}`,
    "Pago en efectivo al recibir.",
    `Ver el pedido: ${datos.urlPedido}`,
  ].join("\n");
}

/** Enlace wa.me con el vale ya escrito. */
export function enlaceWhatsApp(numeroTienda: string, texto: string): string {
  return `https://wa.me/${normalizarNumero(numeroTienda)}?text=${encodeURIComponent(texto)}`;
}
