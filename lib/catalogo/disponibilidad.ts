/**
 * Reglas de visibilidad y disponibilidad de la tienda (F3-C2, HU-26/27).
 * Puras: las usan el repositorio Postgres y los tests.
 */
export type EstadoInterno = "activo" | "agotado" | "descontinuado";

/** ¿Aparece en la tienda? Ni ocultos (HU-23) ni descontinuados (HU-26). */
export function visibleEnTienda(fila: { oculto: boolean; estado: EstadoInterno }): boolean {
  return !fila.oculto && fila.estado !== "descontinuado";
}

/** ¿Se puede comprar? Agotado si el admin lo marca o si no queda stock. */
export function estaDisponible(fila: { estado: EstadoInterno; stock: number }): boolean {
  return fila.estado === "activo" && fila.stock > 0;
}
