import Link from "next/link";
import Etiqueta from "@/components/ui/Etiqueta";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import styles from "./TarjetaProducto.module.css";

/**
 * §7 de docs/design/componentes.md — Tarjeta de producto.
 * El enlace envuelve la tarjeta completa (un solo foco por tarjeta);
 * `alt` va vacío dentro de la tarjeta: el nombre visible da el contexto.
 */
export interface DatosTarjeta {
  slug: string;
  nombre: string;
  /** Meta en 1 línea, p. ej. "Floral · 100 ml". */
  meta?: string;
  precio?: number;
  moneda?: string;
  novedad?: boolean;
  agotado?: boolean;
  /** Sin `imagen` se muestra el placeholder neutral (§14). */
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
        <MarcoImagen
          variante="tarjeta"
          imagen={producto.imagen ? { src: producto.imagen.src } : undefined}
        />
        <div className={styles.cuerpo}>
          {producto.novedad ? <Etiqueta variante="acento">Nuevo</Etiqueta> : null}
          {producto.agotado ? <Etiqueta variante="error">Agotado</Etiqueta> : null}
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
