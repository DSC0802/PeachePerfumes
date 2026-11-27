import Link from "next/link";
import type { Producto } from "@/lib/catalogo";
import { nombreFamilia } from "@/components/landing/familias";
import Boton from "@/components/ui/Boton";
import Contenedor from "@/components/ui/Contenedor";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import BotonAnadir from "./BotonAnadir";
import styles from "./Portada.module.css";

/**
 * Primera pantalla, como la portada de una revista: cabecera PEACHE a todo
 * el ancho y línea de edición; a la izquierda el titular y el perfume en
 * portada con su precio y la compra; a la derecha su foto a sangre.
 */
export interface PortadaProps {
  titulo: string;
  entradilla: string;
  producto: Producto | null;
}

/** «noviembre de 2026», en la hora de Cuba. */
function edicion(): string {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "America/Havana",
  }).format(new Date());
}

export default function Portada({ titulo, entradilla, producto }: PortadaProps) {
  const notas = producto
    ? [...producto.notas.salida, ...producto.notas.corazon].slice(0, 3).join(", ")
    : "";

  return (
    <section className={styles.portada} aria-labelledby="portada-titulo">
      <Contenedor ancho="ancho">
        <div className={styles.cabecera}>
          <p className={styles.masthead} aria-hidden="true">
            Peache
          </p>
          <p className={styles.edicion}>
            <span>Perfumes originales en Cuba</span>
            <span>Edición de {edicion()}</span>
            <span>Pagas en efectivo al recibir</span>
          </p>
        </div>

        <div className={producto ? styles.rejilla : styles.rejillaSola}>
          <div className={styles.texto}>
            <h1 id="portada-titulo" className={styles.titulo}>
              {titulo}
            </h1>
            <p className={styles.entradilla}>{entradilla}</p>
            <Boton variante="secundario" tamano="lg" href="/catalogo">
              Ver el catálogo
            </Boton>
          </div>

          {producto ? (
              <article className={styles.destacado} aria-labelledby="portada-producto">
                <p className={styles.marca}>{producto.marca}</p>
                <h2 id="portada-producto" className={styles.nombre}>
                  <Link href={`/producto/${producto.slug}`}>{producto.nombre}</Link>
                </h2>
                <p className={styles.meta}>
                  {nombreFamilia(producto.familia)} · <span className="cifras">{producto.tamano}</span>
                  {notas ? <> · {notas}</> : null}
                </p>
                <Precio
                  valor={producto.precio}
                  moneda={producto.moneda}
                  variante="ficha"
                  className={styles.precio}
                />
                <BotonAnadir producto={producto} />
              </article>
          ) : null}

          {producto ? (
            <figure className={styles.foto}>
              <MarcoImagen
                variante="ficha"
                imagen={producto.imagen}
                sizes="(max-width: 1024px) 100vw, 50vw"
                prioridad
                className={styles.marco}
              />
              <figcaption className={styles.pie}>
                En portada: {producto.nombre}, de {producto.marca}
              </figcaption>
            </figure>
          ) : null}
        </div>
      </Contenedor>
    </section>
  );
}
