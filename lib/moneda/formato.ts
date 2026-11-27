/**
 * Formato del dinero en toda la tienda (corrección 05/11/2026).
 * `Intl` con «es-CU» pinta «$47,500» y «US$50.00»: el «$» se confunde entre
 * monedas y la coma de miles se lee como decimal en español. Aquí se escribe
 * como lo lee el cliente: «47 500 CUP» y «50,00 USD».
 * - Miles con espacio duro (no se parte la cifra al cambiar de línea).
 * - Decimales con coma: USD siempre con 2; CUP sin decimales (al peso).
 * - El código de la moneda va detrás, visible: nunca un símbolo ambiguo.
 * Puro: lo usan servidor, cliente, el vale de WhatsApp y los tests.
 */

const ESPACIO_MILES = " ";

/** 47500 → «47 500»; 1234.5 con 2 decimales → «1 234,50». */
export function formatearNumero(valor: number, decimales = 0): string {
  const signo = valor < 0 ? "-" : "";
  const [entero, fraccion] = Math.abs(valor).toFixed(decimales).split(".");
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACIO_MILES);
  return signo + (fraccion ? `${conMiles},${fraccion}` : conMiles);
}

/** Decimales por moneda: CUP al peso entero (decisión del cliente), el resto con 2. */
export function decimalesDe(moneda: string): number {
  return moneda === "CUP" ? 0 : 2;
}

/** «47 500 CUP», «50,00 USD». */
export function formatearImporte(valor: number, moneda: string): string {
  return `${formatearNumero(valor, decimalesDe(moneda))}${ESPACIO_MILES}${moneda}`;
}
