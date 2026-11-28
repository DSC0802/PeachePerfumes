import Link from "next/link";
import type { Producto } from "@/lib/catalogo";
import { nombreFamilia } from "@/components/landing/familias";
import Boton from "@/components/ui/Boton";
import Contenedor from "@/components/ui/Contenedor";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import BotonAnadir from "./BotonAnadir";
import styles from "./Portada.module.css";

/** «noviembre de 2026», en la hora de Cuba. */
function edicion(): string {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "America/Havana",
  }).format(new Date());
}

export interface PortadaProps {
  /** Título principal de la sección Inicio. */
  titulo: string;
  /** Entradilla con dirección y método de pago. */
  entradilla: string;
  /** Perfume con más stock (se muestra a la derecha, a sangre). */
  producto: Producto | null;
}

export default function Portada({ titulo, entradilla, producto }: PortadaProps) {
  const notas = producto
    ? [...producto.notas.salida, ...producto.notas.corazon].slice(0, 3).join(", ")
    : "";

  return (
    <section className={styles.portada} aria-labelledby="portada-titulo">
      <Contenedor ancho="ancho">
        {/* ---------- Cabecera de la revista ---------- */}
        <div className={styles.cabecera}>
          <p className={styles.edicion}>
            <span>Perfumes originales en Cuba</span>
            <span>Edición de {edicion()}</span>
            <span>Pagas en efectivo al recibir</span>
          </p>
        </div>

        {/* ---------- Cuerpo: texto izquierda, foto derecha ---------- */}
        <div className={producto ? styles.rejilla : styles.rejillaSola}>
          <div className={styles.texto}>
            {/* Kicker / sección (estilo revista) */}
            <p className={styles.kicker}>Número de este mes</p>

            {/* Título grande con "Peache" como imagen horizontal (logo) */}
            <h1 id="portada-titulo" className={styles.titulo}>
              {titulo}
              <img
                src="/identidadvisual/Peache Versión Horizontal-11.png"
                alt="Peache"
                className={styles.logoPeache}
              />
            </h1>

            {/* Entradilla con dirección y pago */}
            <p className={styles.entradilla}>{entradilla}</p>

            {/* Frase creativa estilo revista */}
            <p className={styles.lema}>
              «Elige tu aroma. Sin sorpresas en el precio.»
            </p>

            <Boton variante="secundario" tamano="lg" href="/catalogo">
              Ver el catálogo
            </Boton>
          </div>

          {/* ---------- Perfume con más stock, a la derecha ---------- */}
          {producto ? (
            <>
              <article className={styles.destacado} aria-labelledby="portada-producto">
                <p className={styles.marca}>{producto.marca}</p>
                <h2 id="portada-producto" className={styles.nombre}>
                  <Link href={`/producto/${producto.slug}`}>{producto.nombre}</Link>
                </h2>
                <p className={styles.meta}>
                  {nombreFamilia(producto.familia)} ·
                  <span className="cifras">{producto.tamano}</span> ·
                  <span className="cifras">{producto.stock} unidades disponibles</span>
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

              <figure className={styles.foto}>
                <MarcoImagen
                  variante="ficha"
                  imagen={producto.imagen}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  prioridad
                  className={styles.marco}
                />
                <figcaption className={styles.pie}>
                  Más stock disponible: {producto.nombre}, de {producto.marca}
                </figcaption>
              </figure>
            </>
          ) : null}
        </div>
      </Contenedor>
    </section>
  );
}
