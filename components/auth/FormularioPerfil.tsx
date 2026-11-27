"use client";

import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { actualizarPerfil } from "@/lib/auth/acciones";
import styles from "./FormularioAuth.module.css";

export interface FormularioPerfilProps {
  email: string;
  nombre?: string | null;
  telefono?: string | null;
  guardado?: boolean;
}

export default function FormularioPerfil({
  email,
  nombre,
  telefono,
  guardado = false,
}: FormularioPerfilProps) {
  return (
    <form action={actualizarPerfil} className={styles.formulario}>
      <CampoTexto
        etiqueta="Email"
        id="perfil-email"
        tipo="email"
        name="email"
        value={email}
        readOnly
        required
      />
      <CampoTexto
        etiqueta="Nombre"
        id="perfil-nombre"
        tipo="text"
        name="nombre"
        autoComplete="name"
        defaultValue={nombre ?? ""}
        ayuda="Opcional. Máximo 80 caracteres."
      />
      <CampoTexto
        etiqueta="Teléfono"
        id="perfil-telefono"
        tipo="tel"
        name="telefono"
        autoComplete="tel"
        defaultValue={telefono ?? ""}
        ayuda="WhatsApp para notificaciones de envío (opcional)."
      />
      {guardado ? (
        <p role="status" className={styles.exito}>
          Cambios guardados.
        </p>
      ) : null}
      <Boton type="submit">
        Guardar cambios
      </Boton>
    </form>
  );
}