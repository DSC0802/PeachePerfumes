import type { ReactNode } from "react";
import styles from "./Etiqueta.module.css";

/** §4 de docs/design/componentes.md — Etiqueta / Badge (no interactivo). */
export type VarianteEtiqueta = "acento" | "neutral" | "success" | "error" | "info";

export interface EtiquetaProps {
  variante?: VarianteEtiqueta;
  children: ReactNode;
  className?: string;
}

export default function Etiqueta({ variante = "neutral", children, className }: EtiquetaProps) {
  const clases = [styles.badge, styles[`badge--${variante}`], className].filter(Boolean).join(" ");
  return <span className={clases}>{children}</span>;
}
