"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  buscarCredencialPorEmail,
  actualizarPerfilUsuario,
  crearUsuario,
} from "./repositorio-usuarios";
import {
  hashContrasena,
  verificarContrasena,
  longitudClaveValida,
} from "./contrasena";
import {
  normalizarEmail,
  emailValido,
  validarNext,
} from "./validadores";
import { crearSesion, borrarSesion, buscarSesionValida } from "./sesiones";
import { NOMBRE_COOKIE, SEGUNDOS_SESION } from "./constantes";

async function fijarCookieSesion(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEGUNDOS_SESION,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Estado que devuelven login y registro al formulario (useActionState). */
export interface EstadoFormularioAuth {
  error?: "email_invalido" | "contrasena_invalida" | "credenciales" | "contrasena_corta" | "email_duplicado";
  /** Email tecleado, para no obligar a reescribirlo tras un error. */
  email?: string;
}

export async function iniciarSesion(
  _estado: EstadoFormularioAuth,
  formData: FormData,
): Promise<EstadoFormularioAuth> {
  const emailRaw = formData.get("email")?.toString() ?? "";
  const contrasenaRaw = formData.get("contrasena")?.toString() ?? "";
  const nextRaw = formData.get("next")?.toString();

  const email = normalizarEmail(emailRaw);
  if (!emailValido(email)) {
    return { error: "email_invalido", email: emailRaw };
  }

  if (!contrasenaRaw.trim() || !longitudClaveValida(contrasenaRaw)) {
    return { error: "contrasena_invalida", email: emailRaw };
  }

  const credencial = await buscarCredencialPorEmail(email);
  if (!credencial) {
    // Igualar el tiempo de respuesta con el caso de email existente
    await hashContrasena(contrasenaRaw).catch(() => {});
    return { error: "credenciales", email: emailRaw };
  }

  const valido = await verificarContrasena(contrasenaRaw, credencial.passwordHash);
  if (!valido) {
    return { error: "credenciales", email: emailRaw };
  }

  const token = await crearSesion(credencial.id);
  await fijarCookieSesion(token);

  const next = validarNext(nextRaw);
  redirect(next ?? (credencial.rol === "admin" ? "/dashboard" : "/"));
}

export async function registrarUsuario(
  _estado: EstadoFormularioAuth,
  formData: FormData,
): Promise<EstadoFormularioAuth> {
  const emailRaw = formData.get("email")?.toString() ?? "";
  const contrasenaRaw = formData.get("contrasena")?.toString() ?? "";
  const nextRaw = formData.get("next")?.toString();

  const email = normalizarEmail(emailRaw);
  if (!emailValido(email)) {
    return { error: "email_invalido", email: emailRaw };
  }

  if (!longitudClaveValida(contrasenaRaw)) {
    return { error: "contrasena_corta", email: emailRaw };
  }

  const passwordHash = await hashContrasena(contrasenaRaw);
  const usuario = await crearUsuario({ email, passwordHash });

  if (!usuario) {
    return { error: "email_duplicado", email: emailRaw };
  }

  const token = await crearSesion(usuario.id);
  await fijarCookieSesion(token);

  const next = validarNext(nextRaw);
  redirect(next ?? "/");
}

export async function cerrarSesion(): Promise<void> {
  const cookieStore = await cookies();
  const cookie = await cookieStore.get(NOMBRE_COOKIE);
  if (cookie?.value) {
    await borrarSesion(cookie.value);
  }
  cookieStore.delete(NOMBRE_COOKIE);
  redirect("/");
}

export async function actualizarPerfil(formData: FormData): Promise<void> {
  const cookieStore = await cookies();
  const cookie = await cookieStore.get(NOMBRE_COOKIE);
  if (!cookie?.value) {
    redirect("/login?next=/perfil");
  }
  const usuario = await buscarSesionValida(cookie.value);
  if (!usuario) {
    redirect("/login?next=/perfil&aviso=expirada");
  }

  const nombreRaw = formData.get("nombre")?.toString() ?? "";
  const telefonoRaw = formData.get("telefono")?.toString() ?? "";

  const nombre = nombreRaw.trim().substring(0, 80);
  const telefono = telefonoRaw.trim().substring(0, 30) || null;

  await actualizarPerfilUsuario(usuario.id, { nombre: nombre || null, telefono });
  redirect("/perfil?guardado=1");
}