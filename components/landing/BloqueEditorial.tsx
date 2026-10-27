import type { ReactNode } from "react";
import Enlace from "@/components/ui/Enlace";
import MarcoImagen from "@/components/ui/MarcoImagen";
import styles from "./BloqueEditorial.module.css";

/**
 * Sección editorial de portada (estados §3.1): 1 imagen `3:2` con el texto
 * al lado/debajo — nunca texto sobre foto (§14.4). En ≥1024px: imagen 55% /
 * texto 45% (estados §5.2).
 */
export interface BloqueEditorialProps {
  titulo: string;
  /** Imagen `3:2` (§14.3). Sin imagen: placeholder neutro. */
  imagen?: { src: string; alt: string };
  /** Párrafos del bloque. */
  children: ReactNode;
  /** Enlace opcional al final del texto (§3). */
  enlace?: { etiqueta: string; href: string };
}

export default function BloqueEditorial({ titulo, imagen, children, enlace }: BloqueEditorialProps) {
  return (
    <section className={styles.bloque} aria-label={titulo}>
      <MarcoImagen variante="editorial" imagen={imagen} className={styles.media} />
      <div className={styles.texto}>
        <h2 className={styles.titulo}>{titulo}</h2>
        <div className={styles.cuerpo}>{children}</div>
        {enlace ? (
          <p className={styles.accion}>
            <Enlace href={enlace.href}>{enlace.etiqueta}</Enlace>
          </p>
        ) : null}
      </div>
    </section>
  );
}
