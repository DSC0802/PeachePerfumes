import styles from "./Skeleton.module.css";

/** §11 de docs/design/componentes.md — Skeleton (bloque decorativo). */
export type VarianteSkeleton = "imagen" | "nombre" | "precio" | "titulo" | "linea";

export interface SkeletonProps {
  variante?: VarianteSkeleton;
  className?: string;
}

/**
 * Bloque de carga con la **misma caja** que el elemento final (cero CLS).
 * El contenedor de la sección es quien pone `aria-busy="true"` y el
 * `sr-only` "Cargando…" (§11); estos bloques son decorativos.
 */
export default function Skeleton({ variante = "linea", className }: SkeletonProps) {
  const clases = [styles.skeleton, styles[`skeleton--${variante}`], className]
    .filter(Boolean)
    .join(" ");
  return <span className={clases} aria-hidden="true" />;
}
