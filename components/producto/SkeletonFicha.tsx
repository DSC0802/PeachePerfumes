import Skeleton from "@/components/ui/Skeleton";
import styles from "./SkeletonFicha.module.css";

/**
 * §11 + estados §3.2 «Carga» — skeleton de ficha con la misma caja que el
 * contenido final: media `1/1`, bloque de `h1`, líneas de texto y bloque de
 * precio + CTA (cero CLS). Decorativo: `loading.tsx` es quien pone
 * `aria-busy="true"` y el `sr-only` «Cargando…» (§11, §4.1).
 */
export default function SkeletonFicha() {
  return (
    <div className={styles.ficha} aria-hidden="true">
      <Skeleton variante="linea" className={styles.migas} />
      <div className={styles.cuerpo}>
        <div className={styles.galeria}>
          {/* Imagen principal `1/1` (§14.3), no el 4/5 de la tarjeta */}
          <Skeleton variante="imagen" className={styles.media} />
        </div>
        <div className={styles.detalle}>
          <Skeleton variante="linea" className={styles.marca} />
          <Skeleton variante="titulo" />
          <Skeleton variante="linea" className={styles.meta} />
          {/* Bloque de precio con la caja final del precio de ficha (§3.2) */}
          <Skeleton variante="precio" className={styles.precio} />
          <div className={styles.cta}>
            <Skeleton variante="linea" className={styles.boton} />
            <Skeleton variante="linea" className={styles.apoyo} />
          </div>
          <div className={styles.lineas}>
            <Skeleton variante="linea" />
            <Skeleton variante="linea" />
            <Skeleton variante="linea" className={styles.lineaCorta} />
          </div>
          <div className={styles.lineas}>
            <Skeleton variante="linea" />
            <Skeleton variante="linea" className={styles.lineaMedia} />
          </div>
        </div>
      </div>
    </div>
  );
}
