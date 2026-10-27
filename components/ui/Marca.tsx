import styles from "./Marca.module.css";

/**
 * Wordmark provisional tipografiado en HTML (identidad §1: `--font-brand-serif`
 * para la línea "Peache"; `--letter-spacing-brand` para "PERFUMES").
 * Se sustituye por el archivo/SVG definitivo del cliente sin tocar componentes.
 * Es texto real, no una imagen: se colorea con `--color-accent` (el rosa de
 * marca oscurecido hasta AA) porque WCAG 1.4.3 sólo exime a los logotipos
 * IMAGEN — axe lo audita como texto normal en cabecera y pie.
 * El espacio entre las dos líneas es visible a propósito (WCAG 2.5.3).
 */
export interface MarcaProps {
  className?: string;
}

export default function Marca({ className }: MarcaProps) {
  const clases = className ? `${styles.marca} ${className}` : styles.marca;
  return (
    <span className={clases}>
      {/* El espacio explícito es texto VISIBLE «Peache PERFUMES» (WCAG 2.5.3:
          el nombre accesible debe contenerlo literalmente). Dentro del flex en
          columna no se renderiza como ítem, así que no altera el diseño. */}
      <span className={styles.nombre}>Peache</span>{" "}
      <span className={styles.linea}>PERFUMES</span>
    </span>
  );
}
