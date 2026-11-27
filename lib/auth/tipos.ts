/**
 * Tipos del dominio identidad (spec F3-B §5).
 * Puro: sin imports de BD ni de next — lo consumen server y client.
 */

export type Rol = "admin" | "cliente";

/** Datos públicos de un usuario. JAMÁS incluye `passwordHash`. */
export interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  telefono: string | null;
  rol: Rol;
}

/** Sólo para verificar credenciales: queda dentro de `lib/auth`. */
export interface CredencialUsuario extends Usuario {
  passwordHash: string;
}

/** Estado que `useActionState` pasa de vuelta a los formularios. */
export interface EstadoFormulario {
  error?: string;
  campo?: "email" | "contrasena" | "nombre" | "telefono";
  ok?: string;
}