"use client";

import { startTransition, useActionState, useState } from "react";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { guardarWhatsappAccion, type EstadoFormularioWhatsapp } from "@/lib/ajustes/acciones";
import auth from "@/components/auth/FormularioAuth.module.css";
import styles from "./FormularioTasa.module.css";

/** Número de WhatsApp de la tienda: adonde llega el vale de cada pedido (F3-D). */
export default function FormularioWhatsapp({ actual }: { actual: string | null }) {
  const [estado, accion, guardando] = useActionState<EstadoFormularioWhatsapp, FormData>(guardarWhatsappAccion, {});
  const [texto, setTexto] = useState(actual ?? "");

  return (
    <form
      action={accion}
      className={styles.formulario}
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        const datos = new FormData(evento.currentTarget);
        startTransition(() => accion(datos));
      }}
    >
      {estado.error ? (
        <p className={auth.errorFormulario} role="alert">
          {estado.error}
        </p>
      ) : null}
      {estado.ok ? (
        <p className={auth.exito} role="status">
          {estado.ok}
        </p>
      ) : null}
      <div className={styles.fila}>
        <CampoTexto
          id="whatsapp"
          name="whatsapp"
          tipo="tel"
          etiqueta="WhatsApp de la tienda"
          inputMode="tel"
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          ayuda="Con el código del país, p. ej. 53 5555 1234. Aquí llega el vale de cada pedido."
          className={styles.campo}
        />
        <Boton type="submit" loading={guardando} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar número"}
        </Boton>
      </div>
    </form>
  );
}
