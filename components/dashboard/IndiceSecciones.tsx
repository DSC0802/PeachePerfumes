import Link from "next/link";
import styles from "./IndiceSecciones.module.css";

export interface TarjetaSeccion {
  titulo: string;
  descripcion: string;
  /** Sin `href`: sección futura, tile informativo «Próximamente» (sin enlace muerto). */
  href?: string;
}

/** Accesos rápidos del resumen (F3-C). Los tiles con `href` son enlaces reales. */
export default function IndiceSecciones({ tarjetas }: { tarjetas: TarjetaSeccion[] }) {
  return (
    <ul className={styles.grid}>
      {tarjetas.map((item) => (
        <li key={item.titulo} className={styles.tarjeta}>
          <h3>
            {item.href ? (
              <Link href={item.href} className={styles.enlace}>
                {item.titulo}
              </Link>
            ) : (
              item.titulo
            )}
          </h3>
          <p>{item.descripcion}</p>
          {item.href ? null : <span className={styles.etiqueta}>Próximamente</span>}
        </li>
      ))}
    </ul>
  );
}
