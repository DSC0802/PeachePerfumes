/**
 * Máquina de estados del pedido (F3-D, decisión del cliente, spec §1.1/§3).
 * Pura: la usan servidor, cliente y tests.
 */
export const ESTADOS_PEDIDO = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "en_camino",
  "entregado",
  "cancelado",
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const NOMBRE_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Qué significa cada estado para el cliente («Mis pedidos»). */
export const EXPLICACION_ESTADO: Record<EstadoPedido, string> = {
  pendiente: "Recibimos tu pedido. Escríbenos por WhatsApp con el vale para coordinar la entrega.",
  confirmado: "Acordamos la entrega contigo.",
  en_preparacion: "Estamos preparando tu pedido.",
  en_camino: "Tu pedido va en camino.",
  entregado: "Entregado y pagado. ¡Gracias!",
  cancelado: "Este pedido se canceló.",
};

/** Orden de avance; `cancelado` queda fuera (se llega desde cualquiera no final). */
const AVANCE: EstadoPedido[] = ["pendiente", "confirmado", "en_preparacion", "en_camino", "entregado"];

/**
 * Transiciones válidas desde un estado (D-F3D-SALTOS): cualquier estado
 * posterior —el primero es el siguiente paso— y, si no es final, cancelar.
 * No se retrocede; `entregado` y `cancelado` son finales.
 */
export function transicionesValidas(estado: EstadoPedido): EstadoPedido[] {
  if (estado === "entregado" || estado === "cancelado") return [];
  return [...AVANCE.slice(AVANCE.indexOf(estado) + 1), "cancelado"];
}

export function esTransicionValida(desde: EstadoPedido, hacia: EstadoPedido): boolean {
  return transicionesValidas(desde).includes(hacia);
}

export function esEstadoPedido(valor: unknown): valor is EstadoPedido {
  return typeof valor === "string" && (ESTADOS_PEDIDO as readonly string[]).includes(valor);
}

/** Estados que siguen reservando stock (todo lo que no está cancelado). */
export function reservaStock(estado: EstadoPedido): boolean {
  return estado !== "cancelado";
}
