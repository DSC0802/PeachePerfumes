"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Producto } from "@/lib/catalogo";
import { nombreFamilia } from "@/components/landing/familias";
import Contenedor from "@/components/ui/Contenedor";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import BotonAnadir from "./BotonAnadir";
import styles from "./Hojeador.module.css";

/**
 * «En este número»: cada perfume es una página entera que se pasa deslizando
 * (o con las flechas). La página que entra levanta su texto; es el único
 * movimiento de autor de la tienda (--duration-page).
 */
function dosCifras(n: number): string {
  return String(n).padStart(2, "0");
}

export default function Hojeador({ productos }: { productos: Producto[] }) {
  const pista = useRef<HTMLOListElement>(null);
  const [actual, setActual] = useState(0);
  const [listo, setListo] = useState(false);
  const total = productos.length;

  // La página «actual» es la que ocupa la mayor parte de la pista.
  useEffect(() => {
    const nodo = pista.current;
    if (!nodo || typeof IntersectionObserver === "undefined") return;
    setListo(true);
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setActual(Number((entrada.target as HTMLElement).dataset.indice));
          }
        }
      },
      { root: nodo, threshold: 0.6 },
    );
    nodo.querySelectorAll<HTMLElement>("[data-indice]").forEach((p) => observador.observe(p));
    return () => observador.disconnect();
  }, [total]);

  const irA = useCallback((indice: number) => {
    const nodo = pista.current;
    if (!nodo) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Cada página mide exactamente el ancho de la pista.
    nodo.scrollTo({ left: indice * nodo.clientWidth, behavior: reducido ? "auto" : "smooth" });
  }, []);

  if (total === 0) return null;

  return (
    <section
      className={styles.seccion}
      aria-labelledby="hojear-titulo"
      data-listo={listo ? "" : undefined}
    >
      <Contenedor ancho="ancho">
        <div className={styles.cabecera}>
          <h2 id="hojear-titulo" className={styles.titulo}>
            En este número
          </h2>
          <div className={styles.controles}>
            <p className={`${styles.folio} cifras`} aria-live="polite">
              <span className="solo-lectura">Página </span>
              {dosCifras(actual + 1)}
              <span aria-hidden="true"> / </span>
              <span className="solo-lectura"> de </span>
              {dosCifras(total)}
            </p>
            <button
              type="button"
              className={styles.flecha}
              onClick={() => irA(actual - 1)}
              disabled={actual === 0}
              aria-label="Perfume anterior"
            >
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                <path d="M16 10H5M9 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.flecha}
              onClick={() => irA(actual + 1)}
              disabled={actual === total - 1}
              aria-label="Perfume siguiente"
            >
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
              </svg>
            </button>
          </div>
        </div>
      </Contenedor>

      <ol ref={pista} className={styles.pista} aria-label="Perfumes de este número">
        {productos.map((producto, i) => (
          <li
            key={producto.slug}
            data-indice={i}
            className={styles.pagina}
            data-actual={i === actual ? "" : undefined}
          >
            <div className={styles.interior}>
              <MarcoImagen
                variante="ficha"
                imagen={producto.imagen}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={styles.foto}
              />
              <div className={styles.texto}>
                <p className={`${styles.numero} cifras`} aria-hidden="true">
                  {dosCifras(i + 1)}
                </p>
                <p className={styles.marca}>{producto.marca}</p>
                <h3 className={styles.nombre}>
                  <Link href={`/producto/${producto.slug}`}>{producto.nombre}</Link>
                </h3>
                <p className={styles.descripcion}>{producto.descripcion}</p>
                <dl className={styles.datos}>
                  <div>
                    <dt>Familia</dt>
                    <dd>{nombreFamilia(producto.familia)}</dd>
                  </div>
                  <div>
                    <dt>Tamaño</dt>
                    <dd className="cifras">{producto.tamano}</dd>
                  </div>
                  {producto.notas.salida.length > 0 ? (
                    <div>
                      <dt>Salida</dt>
                      <dd>{producto.notas.salida.slice(0, 3).join(", ")}</dd>
                    </div>
                  ) : null}
                </dl>
                <Precio valor={producto.precio} moneda={producto.moneda} variante="ficha" />
                <BotonAnadir producto={producto} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
