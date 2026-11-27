"use client";

import { useActionState } from "react";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import Enlace from "@/components/ui/Enlace";
import { registrarUsuario, type EstadoFormularioAuth } from "@/lib/auth/acciones";
import styles from "./FormularioAuth.module.css";

export interface FormularioRegistroProps {
  next?: string;
}

const ESTADO_INICIAL: EstadoFormularioAuth = {};

export default function FormularioRegistro({ next }: FormularioRegistroProps) {
  const [estado, accion, enviando] = useActionState(registrarUsuario, ESTADO_INICIAL);

  const errorEmail =
    estado.error === "email_invalido"
      ? "Introduce un email válido, p. ej. nombre@correo.com."
      : undefined;
  const errorContrasena =
    estado.error === "contrasena_corta"
      ? "La contraseña debe tener entre 8 y 128 caracteres."
      : undefined;
  const hrefLogin = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <form action={accion} className={styles.formulario}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <CampoTexto
        etiqueta="Email"
        id="registro-email"
        tipo="email"
        name="email"
        autoComplete="email"
        required
        defaultValue={estado.email ?? ""}
        key={`email-${estado.email ?? ""}`}
        error={errorEmail}
      />
      <CampoTexto
        etiqueta="Contraseña"
        id="registro-contrasena"
        tipo="password"
        name="contrasena"
        autoComplete="new-password"
        required
        minLength={8}
        ayuda="Mínimo 8 caracteres."
        error={errorContrasena}
      />
      {estado.error === "email_duplicado" ? (
        <p role="alert" className={styles.errorFormulario}>
          Ese email ya tiene una cuenta. <Enlace href={hrefLogin}>Inicia sesión</Enlace>.
        </p>
      ) : null}
      <Boton type="submit" loading={enviando}>
        Crear cuenta
      </Boton>
    </form>
  );
}
