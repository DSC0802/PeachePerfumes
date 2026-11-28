import styles from "./Marca.module.css";

/**
 * Marca Peache — identidad visual (2026-11-27).
 * Logo horizontal: imagotipo (P) a la izquierda + wordmark "Peache" a la derecha.
 * Se usa en cabecera, footer y donde aparezca la marca.
 * Sin "Joyería" — solo "Peache".
 */
export interface MarcaProps {
  className?: string;
  /** Ancho máximo del logo (default: se ajusta al contenedor). */
  anchoMaximo?: string;
}

export default function Marca({ className, anchoMaximo }: MarcaProps) {
  const clases = className ? `${styles.marca} ${className}` : styles.marca;
  return (
    <span className={clases} style={anchoMaximo ? { maxWidth: anchoMaximo } : undefined}>
      <img
        src="/identidadvisual/Peache Imagotipo -03.png"
        alt="Marca Peache"
        className={styles.imagotipo}
        aria-hidden="true"
      />
      <span className={styles.nombre}>Peache</span>
    </span>
  );
}
