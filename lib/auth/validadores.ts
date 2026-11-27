/**
 * Validadores de identidad (spec F3-B §5 y §11).
 * Puros: sin imports de BD ni de next/headers (testables con vitest).
 */

/** Email canónico: trim + minúsculas (spec §4: columna normalizada). */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Forma práctica sin dependencias: algo @ algo . algo, sin espacios.
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(email: string): boolean {
  // RFC 5321: 254 es el tope de longitud de una dirección completa.
  if (email.length === 0 || email.length > 254) {
    return false;
  }
  return REGEX_EMAIL.test(email);
}

/**
 * `?next=` seguro (anti open-redirect, spec §5): sólo rutas INTERNAS.
 * Acepta un valor ya validado o null si no lo es; nunca lanza.
 * Reglas: string · trim · 1..512 · empieza por `/` · sin `//` ni `/\` ·
 * sin caracteres de control ni `"` ni `\` (cabeceras/JSX-hostiles).
 */
export function validarNext(next: unknown): string | null {
  if (typeof next !== "string") {
    return null;
  }
  const valor = next.trim();
  if (valor.length < 1 || valor.length > 512) {
    return null;
  }
  if (!valor.startsWith("/")) {
    return null;
  }
  // "//evil" y "/\evil" son rutas que el navegador resolve como externas.
  if (valor.startsWith("//") || valor.startsWith("/\\")) {
    return null;
  }
  if (/[\u0000-\u001f\u007f"\\]/.test(valor)) {
    return null;
  }
  return valor;
}
