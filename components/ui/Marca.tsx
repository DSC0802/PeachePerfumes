import styles from "./Marca.module.css";

/**
 * Marca Peache — identidad visual (2026-11-27).
 * Logo horizontal completo (imagotipo + "Peache") en una sola imagen PNG.
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
        src="/identidadvisual/Peache Versión Horizontal-11.png"
        alt="Peache"
        className={styles.logo}
        aria-hidden="true"
      />
    </span>
  );
}
