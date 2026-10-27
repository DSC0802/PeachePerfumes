"use client";

import { useEffect, useRef } from "react";
import type { MouseEvent, ReactNode, ReactEventHandler } from "react";
import styles from "./HojaModal.module.css";

/**
 * §12 de docs/design/componentes.md — Modal / Sheet.
 * `<dialog>` nativo con `showModal()`: foco atrapado y `Esc` gratis.
 * Variantes: `inferior` (bottom-sheet móvil, centrado ≥768px según §12),
 * `lateral` (menú de cabecera, §5) y `centrado`.
 */
export type VarianteHoja = "inferior" | "lateral" | "centrado";

export interface HojaModalProps {
  id: string;
  abierto: boolean;
  onCerrar: () => void;
  /** Título visible: `aria-labelledby` apunta a él (§12, nunca sólo `aria-label`). */
  titulo: string;
  /** `aria-label` literal del botón de cierre (p. ej. "Cerrar filtros"). */
  etiquetaCerrar?: string;
  variante?: VarianteHoja;
  /** Pie de acciones sticky (§12). */
  pie?: ReactNode;
  children: ReactNode;
}

export default function HojaModal({
  id,
  abierto,
  onCerrar,
  titulo,
  etiquetaCerrar = "Cerrar",
  variante = "inferior",
  pie,
  children,
}: HojaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = dialogRef.current;
    if (!dialogo) return;

    if (abierto && !dialogo.open) {
      dialogo.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!abierto && dialogo.open) {
      dialogo.close();
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [abierto]);

  const manejarCancel: ReactEventHandler<HTMLDialogElement> = (evento) => {
    // `Esc` dispara `cancel`; sincronizamos el estado con el padre
    evento.preventDefault();
    onCerrar();
  };

  const manejarClick = (evento: MouseEvent<HTMLDialogElement>) => {
    // Clic en el scrim (el backdrop tiene como target el propio <dialog>)
    if (evento.target === dialogRef.current) onCerrar();
  };

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className={`${styles.hoja} ${styles[`hoja--${variante}`]}`}
      aria-labelledby={`${id}-titulo`}
      onCancel={manejarCancel}
      onClick={manejarClick}
    >
      <div className={styles.cabecera}>
        <h2 id={`${id}-titulo`} className={styles.titulo}>
          {titulo}
        </h2>
        <button
          type="button"
          className={styles.cerrar}
          aria-label={etiquetaCerrar}
          title={etiquetaCerrar}
          onClick={onCerrar}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className={styles.cuerpo}>{children}</div>
      {pie ? <div className={styles.pie}>{pie}</div> : null}
    </dialog>
  );
}
