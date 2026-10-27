import type { ReactNode } from "react";
import styles from "./RejillaCatalogo.module.css";

/**
 * §8 de docs/design/componentes.md — Rejilla de catálogo.
 * Sólo visual (sin `role="grid"`): el orden DOM = orden de lectura = foco.
 */
export interface RejillaCatalogoProps {
  children: ReactNode;
  className?: string;
}

export default function RejillaCatalogo({ children, className }: RejillaCatalogoProps) {
  const clases = [styles.rejilla, className].filter(Boolean).join(" ");
  return <div className={clases}>{children}</div>;
}
