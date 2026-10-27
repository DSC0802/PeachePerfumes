import Skeleton from "@/components/ui/Skeleton";
import styles from "./SkeletonTarjeta.module.css";

/**
 * Skeleton con el mismo contenedor y caja que `TarjetaProducto` (§11: cero CLS).
 * Decorativo: el contenedor de la sección pone `aria-busy="true"` y el
 * `sr-only` "Cargando…" (§11, estados §4.1).
 */
export default function SkeletonTarjeta() {
  return (
    <div className={styles.tarjeta} aria-hidden="true">
      <Skeleton variante="imagen" />
      <div className={styles.cuerpo}>
        <Skeleton variante="nombre" />
        <Skeleton variante="linea" className={styles.meta} />
        <Skeleton variante="precio" className={styles.precio} />
      </div>
    </div>
  );
}
