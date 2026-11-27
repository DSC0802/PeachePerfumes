import type { ElementType, ReactNode } from "react";
import styles from "./Contenedor.module.css";

/** Patrón `contenedor` común (arquitectura §3 / identidad §8). */
export type AnchoContenedor = "maximo" | "estrecho" | "ancho";

export interface ContenedorProps {
  ancho?: AnchoContenedor;
  as?: ElementType;
  /** Añade aire arriba y abajo: para páginas sin cabecera propia (cuenta, carrito, panel). */
  seccion?: boolean;
  className?: string;
  children: ReactNode;
}

export default function Contenedor({
  ancho = "maximo",
  as: Etiqueta = "div",
  seccion = false,
  className,
  children,
}: ContenedorProps) {
  const clases = [
    styles.contenedor,
    styles[`contenedor--${ancho}`],
    seccion ? styles["contenedor--seccion"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <Etiqueta className={clases}>{children}</Etiqueta>;
}
