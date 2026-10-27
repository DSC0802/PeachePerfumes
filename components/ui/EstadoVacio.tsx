import type { ReactNode } from "react";
import styles from "./EstadoVacio.module.css";

/** §9 de docs/design/componentes.md — Estado vacío (y errores, misma anatomía). */
export interface EstadoVacioProps {
  titulo: string;
  /** Texto de apoyo (§4.2/§4.3 del microcopy). */
  apoyo?: string;
  /** Encabezado real: la navegación por encabezados anuncia el estado (§9). */
  nivelTitulo?: "h1" | "h2" | "h3";
  /** `inline`: dentro de la rejilla, sin padding-block grande (§9). */
  variante?: "pantalla" | "inline";
  /** Icono ilustrativo; por defecto una lupa (SVG, 48px, decorativo). */
  icono?: ReactNode;
  /** Acción: `<Boton>` (cambia estado) o `<Enlace>` (navega). */
  children?: ReactNode;
  className?: string;
}

function IconoPorDefecto(): ReactNode {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="21" cy="21" r="13" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M31 31l9 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function EstadoVacio({
  titulo,
  apoyo,
  nivelTitulo = "h2",
  variante = "pantalla",
  icono,
  children,
  className,
}: EstadoVacioProps) {
  const Titulo = nivelTitulo;
  const clases = [
    styles.estado,
    variante === "inline" ? styles["estado--inline"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const clasesTitulo = [styles.titulo, nivelTitulo === "h1" ? styles["titulo--h1"] : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clases}>
      <span className={styles.icono} aria-hidden="true">
        {icono ?? <IconoPorDefecto />}
      </span>
      <Titulo className={clasesTitulo}>{titulo}</Titulo>
      {apoyo ? <p className={styles.apoyo}>{apoyo}</p> : null}
      {children ? <div className={styles.accion}>{children}</div> : null}
    </div>
  );
}
