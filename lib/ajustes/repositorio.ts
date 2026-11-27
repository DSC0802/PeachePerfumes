/**
 * Ajustes de la tienda (F3-D, spec §3): pares clave → valor que fija el admin.
 * Sólo servidor; comparte el pool de identidad.
 */
import { eq, sql } from "drizzle-orm";
import { ajustes } from "../../db/schema";
import { obtenerBase } from "../auth/base";

export const CLAVE_WHATSAPP = "whatsapp_tienda";

export async function obtenerAjuste(clave: string): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const [fila] = await obtenerBase().select().from(ajustes).where(eq(ajustes.clave, clave)).limit(1);
    return fila?.valor ?? null;
  } catch (error) {
    console.error(`[ajustes] no se pudo leer «${clave}»`, error);
    return null;
  }
}

export async function guardarAjuste(clave: string, valor: string): Promise<void> {
  await obtenerBase()
    .insert(ajustes)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: ajustes.clave, set: { valor, actualizadoEn: sql`now()` } });
}

/** Número de WhatsApp de la tienda (sólo dígitos) o null si no está configurado. */
export function obtenerWhatsappTienda(): Promise<string | null> {
  return obtenerAjuste(CLAVE_WHATSAPP);
}
