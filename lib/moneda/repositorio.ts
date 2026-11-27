/**
 * Tasas de cambio en PostgreSQL (F3-C2, HU-52). Sólo servidor.
 * Comparte el pool de identidad (`lib/auth/base.ts`), como el panel admin.
 */
import { desc, eq } from "drizzle-orm";
import { tasasCambio, usuarios } from "../../db/schema";
import { obtenerBase } from "../auth/base";

export interface TasaVigente {
  cupPorUsd: number;
  creadaEn: Date;
}

export interface EntradaHistorialTasa extends TasaVigente {
  id: string;
  /** Email de quien la fijó; null si la cuenta ya no existe. */
  autor: string | null;
}

/**
 * Tasa vigente (la más reciente). Nunca lanza: sin BD, sin tabla o sin filas
 * devuelve null y la tienda se queda en USD (spec §3, fuente demo).
 */
export async function obtenerTasaVigente(): Promise<TasaVigente | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const [fila] = await obtenerBase()
      .select({ cupPorUsd: tasasCambio.cupPorUsd, creadaEn: tasasCambio.creadaEn })
      .from(tasasCambio)
      .orderBy(desc(tasasCambio.creadaEn))
      .limit(1);
    return fila ? { cupPorUsd: Number(fila.cupPorUsd), creadaEn: fila.creadaEn } : null;
  } catch (error) {
    console.error("[moneda] no se pudo leer la tasa vigente", error);
    return null;
  }
}

/** Registra una tasa nueva (pasa a ser la vigente). */
export async function guardarTasa(cupPorUsd: number, usuarioId: string): Promise<TasaVigente> {
  const [fila] = await obtenerBase()
    .insert(tasasCambio)
    .values({ cupPorUsd: cupPorUsd.toFixed(2), usuarioId })
    .returning({ cupPorUsd: tasasCambio.cupPorUsd, creadaEn: tasasCambio.creadaEn });
  return { cupPorUsd: Number(fila.cupPorUsd), creadaEn: fila.creadaEn };
}

/** Últimas tasas, la vigente primero. */
export async function historialTasas(limite = 10): Promise<EntradaHistorialTasa[]> {
  const filas = await obtenerBase()
    .select({
      id: tasasCambio.id,
      cupPorUsd: tasasCambio.cupPorUsd,
      creadaEn: tasasCambio.creadaEn,
      autor: usuarios.email,
    })
    .from(tasasCambio)
    .leftJoin(usuarios, eq(tasasCambio.usuarioId, usuarios.id))
    .orderBy(desc(tasasCambio.creadaEn))
    .limit(limite);
  return filas.map((f) => ({ ...f, cupPorUsd: Number(f.cupPorUsd) }));
}
