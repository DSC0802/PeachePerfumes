"use client";

import type { ReactNode } from "react";

/**
 * <form> de server action que pide confirmación antes de enviarse
 * (p. ej. ocultar un producto). Sin JS, el formulario se envía igual.
 */
export default function FormularioConfirmado({
  accion,
  mensaje,
  className,
  children,
}: {
  accion: (formData: FormData) => Promise<void>;
  mensaje: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={accion}
      className={className}
      onSubmit={(evento) => {
        if (!window.confirm(mensaje)) evento.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
