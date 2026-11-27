"use client";

import { useActionState } from "react";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { iniciarSesion, type EstadoFormularioAuth } from "@/lib/auth/acciones";
import styles from "./FormularioAuth.module.css";

export interface FormularioLoginProps {
  next?: string;
}

const ESTADO_INICIAL: EstadoFormularioAuth = {};

export default function FormularioLogin({ next }: FormularioLoginProps) {
  const [estado, accion, enviando] = useActionState(iniciarSesion, ESTADO_INICIAL);

  const errorEmail =
    estado.error === "email_invalido" ? "Introduce un email válido." : undefined;
  const errorContrasena =
    estado.error === "contrasena_invalida" ? "Introduce tu contraseña." : undefined;
  // Mensaje genérico: no revelar si el email existe.
  const errorGeneral =
    estado.error === "credenciales" ? "Email o contraseña incorrectos." : undefined;

  return (
    <form action={accion} className={styles.formulario}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <CampoTexto
        etiqueta="Email"
        id="login-email"
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
        id="login-contrasena"
        tipo="password"
        name="contrasena"
        autoComplete="current-password"
        required
        error={errorContrasena}
      />
      {errorGeneral ? (
        <p role="alert" className={styles.errorFormulario}>
          {errorGeneral}
        </p>
      ) : null}
      <Boton type="submit" loading={enviando}>
        Iniciar sesión
      </Boton>
    </form>
  );
}
