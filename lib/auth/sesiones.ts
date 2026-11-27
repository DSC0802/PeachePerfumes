import { createHash, randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import {
  sesiones as tablaSesiones,
  usuarios as tablaUsuarios,
} from "../../db/schema";
import { obtenerBase } from "./base";
import type { Usuario } from "./tipos";

import { SEGUNDOS_SESION } from "./constantes";

export const OPCIONES_COOKIE_SESION = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SEGUNDOS_SESION,
  secure: false, // false en http local; se ajusta en acciones.ts según protocolo
} as const;

/** SHA-256 del token en hex (64 caracteres). */
export function hashearToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Fila → Usuario (solo campos públicos). */
function aUsuario(fila: typeof tablaUsuarios.$inferSelect): Usuario {
  return {
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    telefono: fila.telefono,
    rol: fila.rol,
  };
}

/**
 * Crea una nueva sesión válida 30 días.
 * Devuelve el token aleatorio (se envía en cookie por el caller).
 * Borra sesiones caducadas con antelación (limpieza oportunista).
 */
export async function crearSesion(usuarioId: string): Promise<string> {
  const db = obtenerBase();
  const ahora = new Date();
  const expiraEn = new Date(ahora.getTime() + SEGUNDOS_SESION * 1000);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashearToken(token);

  // Limpieza oportunista de caducadas
  await db
    .delete(tablaSesiones)
    .where(sql`${tablaSesiones.expiraEn} < ${ahora}`);

  await db.insert(tablaSesiones).values({
    usuarioId,
    tokenHash,
    creadaEn: ahora,
    expiraEn,
  });

  return token;
}

/**
 * Busca la sesión válida asociada al token de la cookie (sin hashear).
 * Si la sesión está caducada, la borra y devuelve null.
 */
export async function buscarSesionValida(
  token: string,
): Promise<Usuario | null> {
  const db = obtenerBase();
  const ahora = new Date();
  // La BD guarda el SHA-256 del token, nunca el token de la cookie.
  const tokenHash = hashearToken(token);

  const [fila] = await db
    .select({
      usuario: tablaUsuarios,
    })
    .from(tablaSesiones)
    .innerJoin(tablaUsuarios, eq(tablaSesiones.usuarioId, tablaUsuarios.id))
    .where(
      and(
        eq(tablaSesiones.tokenHash, tokenHash),
        sql`${tablaSesiones.expiraEn} > ${ahora}`,
      ),
    )
    .limit(1);

  if (!fila) {
    // Sesión no válida o caducada → borrar la fila (si existe)
    await db
      .delete(tablaSesiones)
      .where(eq(tablaSesiones.tokenHash, tokenHash));
    return null;
  }

  return aUsuario(fila.usuario);
}

/**
 * Cierra sesión: borra la fila de BD.
 * El borrado de cookie lo hace el caller (server action).
 */
export async function borrarSesion(token: string): Promise<void> {
  const db = obtenerBase();
  const tokenHash = hashearToken(token);
  await db.delete(tablaSesiones).where(eq(tablaSesiones.tokenHash, tokenHash));
}