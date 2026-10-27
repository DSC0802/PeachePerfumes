import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./CampoTexto.module.css";

/**
 * §2 de docs/design/componentes.md — Campo de texto.
 * Anatomía: etiqueta arriba → control → texto de apoyo (ayuda **o** error,
 * no ambos a la vez). Presentacional: quien necesita estado de cliente
 * (buscador) lo envuelve en un componente cliente.
 */
export interface CampoTextoProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  /** `<label>` real siempre (nunca sólo placeholder). */
  etiqueta: string;
  id: string;
  tipo?: "search" | "text" | "email" | "tel" | "number";
  /** Ayuda persistente: sigue en `aria-describedby` aunque haya error (§2). */
  ayuda?: string;
  /** Mensaje de error: `role="alert"`, junto al campo (§2, estados §4.3). */
  error?: string;
  className?: string;
}

function IconoError(): ReactNode {
  return (
    <svg
      className={styles.error__icono}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.25" r="0.9" fill="currentColor" />
    </svg>
  );
}

export default function CampoTexto({
  etiqueta,
  id,
  tipo = "text",
  ayuda,
  error,
  className,
  disabled,
  readOnly,
  ...resto
}: CampoTextoProps) {
  const describedBy = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  const clases = [styles.control, error ? styles["control--error"] : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <input
        {...resto}
        id={id}
        type={tipo}
        className={clases}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {ayuda ? (
        <p id={`${id}-ayuda`} className={styles.ayuda}>
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          <IconoError />
          {error}
        </p>
      ) : null}
    </div>
  );
}
