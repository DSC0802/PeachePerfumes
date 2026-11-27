import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buscarSesionValida } from "./sesiones";
import { NOMBRE_COOKIE } from "./constantes";
import type { Usuario } from "./tipos";

/**
 * Obtiene el usuario actual a partir de la cookie de sesión.
 * Usado por el layout (navbar) y el dashboard (defensa en profundidad).
 */
export async function obtenerSesionActual(): Promise<Usuario | null> {
  const cookie = (await cookies()).get(NOMBRE_COOKIE);
  if (!cookie?.value) {
    return null;
  }
  return buscarSesionValida(cookie.value);
}

/**
 * Asegura que el usuario es admin. Si no lo es, redirige a login.
 * Uso: layout de /dashboard (defensa en profundidad tras el proxy).
 */
export async function requerirAdmin(): Promise<Usuario> {
  const usuario = await obtenerSesionActual();
  if (!usuario || usuario.rol !== "admin") {
    redirect(`/login?next=/dashboard`);
  }
  return usuario;
}