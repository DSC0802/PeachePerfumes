import Link from "next/link";
import Etiqueta from "@/components/ui/Etiqueta";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import styles from "./TarjetaProducto.module.css";

/**
 * Tarjeta de producto (mundo «revista»): la foto y, debajo, como un pie de
 * foto, la marca, el nombre como titular, el meta y el precio en cifras
 * tabulares. Toda la tarjeta es un único enlace a la ficha.
 */
export interface DatosTarjeta {
  slug: string;
  nombre: string;
  /** Procedencia: la marca, cosida al talón. */
  marca?: string;
  meta?: string;
  precio?: number;
  moneda?: string;
  novedad?: boolean;
  agotado?: boolean;
  imagen?: { src: string };
}

export interface TarjetaProductoProps {
  producto: DatosTarjeta;
  className?: string;
}

export default function TarjetaProducto({ producto, className }: TarjetaProductoProps) {
  const clases = [styles.tarjeta, className].filter(Boolean).join(" ");

  return (
    <article className={clases}>
      <Link href={`/producto/${producto.slug}`} className={styles.enlace}>
        <div className={styles.media}>
          <MarcoImagen
            variante="tarjeta"
            imagen={producto.imagen ? { src: producto.imagen.src } : undefined}
          />
          {producto.novedad || producto.agotado ? (
            <div className={styles.etiquetas}>
              {producto.novedad ? <Etiqueta variante="acento">Nuevo</Etiqueta> : null}
              {producto.agotado ? <Etiqueta variante="error">Agotado</Etiqueta> : null}
            </div>
          ) : null}
        </div>
        <div className={styles.cuerpo}>
          {producto.marca ? <p className={styles.marca}>{producto.marca}</p> : null}
          <h3 className={styles.nombre}>{producto.nombre}</h3>
          {producto.meta ? <p className={styles.meta}>{producto.meta}</p> : null}
          {typeof producto.precio === "number" ? (
            <Precio
              valor={producto.precio}
              moneda={producto.moneda}
              variante="tarjeta"
              className={styles.precio}
            />
          ) : null}
        </div>
      </Link>
    </article>
  );
}
