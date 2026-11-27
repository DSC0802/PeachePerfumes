import { eq } from "drizzle-orm";
import { usuarios as tablaUsuarios } from "../../db/schema";
import { obtenerBase } from "./base";
import type { CredencialUsuario, Usuario } from "./tipos";

type FilaUsuario = typeof tablaUsuarios.$inferSelect;

/** Fila → dominio. `passwordHash` queda fuera de `Usuario` (spec §11). */
function aUsuario(fila: FilaUsuario): Usuario {
  return {
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    telefono: fila.telefono,
    rol: fila.rol,
  };
}

/** Fila → Credencial (para login: passwordHash incluido). */
function aCredencial(fila: FilaUsuario): CredencialUsuario {
  return {
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    telefono: fila.telefono,
    rol: fila.rol,
    passwordHash: fila.passwordHash,
  };
}

/**
 * Alta de usuario. El email debe venir ya normalizado (`normalizarEmail`).
 * Devuelve `null` si el email ya existe (conflicto UNIQUE → sin fila).
 */
export async function crearUsuario(datos: {
  email: string;
  passwordHash: string;
  nombre?: string | null;
  telefono?: string | null;
}): Promise<Usuario | null> {
  const db = obtenerBase();
  try {
    const filas = await db
      .insert(tablaUsuarios)
      .values({
        email: datos.email,
        passwordHash: datos.passwordHash,
        nombre: datos.nombre ?? null,
        telefono: datos.telefono ?? null,
        // el rol toma su default: 'cliente' (spec §5: nunca auto-promoción)
      })
      .returning()
      .onConflictDoNothing();
    // onConflictDoNothing: si hay conflicto, devuelve [].then([]) → filas = []
    const fila = filas[0];
    return fila ? aUsuario(fila) : null;
  } catch {
    return null;
  }
}

/**
 * Busca un usuario completo (con passwordHash) para login.
 * Normaliza el email antes de buscar (trim + minúsculas).
 */
export async function buscarCredencialPorEmail(
  emailNormalizado: string,
): Promise<CredencialUsuario | null> {
  const db = obtenerBase();
  const [fila] = await db
    .select()
    .from(tablaUsuarios)
    .where(eq(tablaUsuarios.email, emailNormalizado))
    .limit(1);
  return fila ? aCredencial(fila) : null;
}

/**
 * Busca un usuario por ID (sin passwordHash). Para el perfil.
 */
export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  const db = obtenerBase();
  const [fila] = await db
    .select()
    .from(tablaUsuarios)
    .where(eq(tablaUsuarios.id, id))
    .limit(1);
  return fila ? aUsuario(fila) : null;
}

/**
 * Actualiza nombre y teléfono del perfil. Devuelve el usuario actualizado.
 */
export async function actualizarPerfilUsuario(
  id: string,
  datos: { nombre?: string | null; telefono?: string | null },
): Promise<Usuario | null> {
  const db = obtenerBase();
  const [fila] = await db
    .update(tablaUsuarios)
    .set({
      nombre: datos.nombre ?? null,
      telefono: datos.telefono ?? null,
      actualizadoEn: new Date(),
    })
    .where(eq(tablaUsuarios.id, id))
    .returning();
  return fila ? aUsuario(fila) : null;
}