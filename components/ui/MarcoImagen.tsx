"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import Image from "next/image";
import styles from "./MarcoImagen.module.css";

/**
 * §14 de docs/design/componentes.md — Tratamiento de imágenes.
 * Marco que protege la foto: fondo `--color-surface-alt` siempre detrás,
 * recorte fijo por contexto, `object-fit: cover` sin filtros jamás, y
 * placeholder con el imagotipo provisional cuando no hay foto o falla (§14.9).
 */
export type VarianteMarco = "tarjeta" | "hero" | "editorial" | "ficha";

export interface MarcoImagenProps {
  variante: VarianteMarco;
  /** Sin `imagen` (o si la foto falla) se muestra el placeholder neutro. */
  imagen?: { src: string; /** Vacío dentro de la tarjeta (§7); descriptivo en ficha/hero. */ alt?: string };
  /** Recomendación `sizes` de next/image; por defecto la de arquitectura §9. */
  sizes?: string;
  /** Sólo para el LCP (hero de portada / imagen principal de ficha) (§14.6). */
  prioridad?: boolean;
  className?: string;
}

const SIZES: Record<VarianteMarco, string> = {
  tarjeta: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px",
  hero: "(max-width: 1024px) 100vw, 50vw",
  editorial: "(max-width: 1024px) 100vw, 55vw",
  ficha: "(max-width: 1024px) 100vw, 45vw",
};

function Imagotipo(): ReactElement {
  return (
    <svg className={styles.imagotipo} viewBox="0 0 48 48" aria-hidden="true">
      <text x="24" y="32" textAnchor="middle" fontSize="26">
        PP
      </text>
    </svg>
  );
}

export default function MarcoImagen({
  variante,
  imagen,
  sizes,
  prioridad = false,
  className,
}: MarcoImagenProps) {
  const [falla, setFalla] = useState(false);
  const hayFoto = Boolean(imagen?.src) && !falla;

  const clases = [styles.marco, styles[`marco--${variante}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clases}>
      {hayFoto ? (
        <Image
          className={styles.foto}
          src={imagen?.src ?? ""}
          alt={imagen?.alt ?? ""}
          fill
          sizes={sizes ?? SIZES[variante]}
          priority={prioridad}
          onError={() => setFalla(true)}
        />
      ) : (
        <span className={styles.placeholder} aria-hidden="true">
          <Imagotipo />
        </span>
      )}
    </div>
  );
}
