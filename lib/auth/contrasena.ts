import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de contraseña con scrypt de `node:crypto` (spec F3-B §5):
 * N=16384, r=8, p=1, keylen=64, sal aleatoria de 16 B por usuario.
 * Formato almacenado: `scrypt$N$r$p$salBase64$claveBase64`.
 * Cero dependencias nuevas (spec §3). La comparación es timing-safe.
 */

export const LONGITUD_MINIMA = 8; // spec §5
export const LONGITUD_MAXIMA = 128; // tope anti-DoS (spec §5)

const PARAMETROS = { N: 16384, r: 8, p: 1 } as const;
const LONGITUD_CLAVE = 64;
const LONGITUD_SAL = 16;

// Límites sanos para parsear hashes ajenos (spec §11): un hash corrupto o
// con parámetros absurdos NO debe convertirse en una bomba de CPU.
const N_MAXIMO = 2 ** 20;
const R_MAXIMO = 32;
const P_MAXIMO = 16;

export function longitudClaveValida(contrasena: string): boolean {
  return (
    contrasena.length >= LONGITUD_MINIMA && contrasena.length <= LONGITUD_MAXIMA
  );
}

export async function hashContrasena(contrasena: string): Promise<string> {
  if (!longitudClaveValida(contrasena)) {
    throw new Error(
      `La contraseña debe tener entre ${LONGITUD_MINIMA} y ${LONGITUD_MAXIMA} caracteres.`,
    );
  }
  const sal = randomBytes(LONGITUD_SAL);
  const clave = scryptSync(contrasena, sal, LONGITUD_CLAVE, PARAMETROS);
  return [
    "scrypt",
    PARAMETROS.N,
    PARAMETROS.r,
    PARAMETROS.p,
    sal.toString("base64"),
    clave.toString("base64"),
  ].join("$");
}

/**
 * Verifica una contraseña contra el formato `scrypt$N$r$p$sal$clave`.
 * NUNCA lanza: formato corrupto, parámetros fuera de límites sanos o
 * errores de scrypt → `false` (el caller decide el mensaje).
 */
export async function verificarContrasena(
  contrasena: string,
  almacenado: string,
): Promise<boolean> {
  const partes = almacenado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") {
    return false;
  }
  const [, nTexto, rTexto, pTexto, salB64, claveB64] = partes;
  const N = Number(nTexto);
  const R = Number(rTexto);
  const P = Number(pTexto);
  if (!Number.isInteger(N) || !Number.isInteger(R) || !Number.isInteger(P)) {
    return false;
  }
  if (N < 2 || N > N_MAXIMO || R < 1 || R > R_MAXIMO || P < 1 || P > P_MAXIMO) {
    return false;
  }
  const sal = Buffer.from(salB64, "base64");
  const claveEsperada = Buffer.from(claveB64, "base64");
  if (sal.length === 0 || claveEsperada.length !== LONGITUD_CLAVE) {
    return false;
  }
  let clave: Buffer;
  try {
    clave = scryptSync(contrasena, sal, claveEsperada.length, {
      N,
      r: R,
      p: P,
    });
  } catch {
    return false; // scrypt puede fallar con parámetros hostiles
  }
  if (clave.length !== claveEsperada.length) {
    return false;
  }
  return timingSafeEqual(clave, claveEsperada);
}
