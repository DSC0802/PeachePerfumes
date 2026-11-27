"use client";

import type { Categoria, Producto } from "@/lib/catalogo";
import { nombreFamilia } from "@/components/landing/familias";
import { useEffect, useRef, useState } from "react";
import Boton from "@/components/ui/Boton";
import Enlace from "@/components/ui/Enlace";
import Etiqueta from "@/components/ui/Etiqueta";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import { useCarrito } from "@/components/carrito/CarritoContexto";
import NotasOlfativas from "./NotasOlfativas";
import styles from "./FichaProducto.module.css";

/**
 * Ficha de `/producto/[slug]` como página de revista (2026-11-07): migas →
 * foto a la izquierda (sticky ≥1024px) → marca, nombre como titular y
 * descripción como entradilla → datos clave → precio + compra → notas.
 * Un único `h1` (el nombre del perfume) y jerarquía `h2`/`h3` sin saltos. El
 * dinero se pinta SÓLO con `Precio` (D-DINERO-1).
 */
export interface FichaProductoProps {
  producto: Producto;
  /** `null` si `categoriaId` no resuelve: se omite ese dato y nada más. */
  categoria: Categoria | null;
}

export default function FichaProducto({ producto, categoria }: FichaProductoProps) {
  const { agregarProducto } = useCarrito();
  const [confirmacion, setConfirmacion] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia el aviso pendiente al salir de la página (evita setState tras desmontar).
  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  const manejarAgregarAlCarrito = () => {
    agregarProducto(producto);
    setConfirmacion(true);
    // Pulsaciones seguidas reinician la ventana en vez de apilar temporizadores.
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setConfirmacion(false), 2500);
  };

  return (
    <article className={styles.ficha}>
      <nav aria-label="Migas de pan">
        <ol className={styles.migas}>
          <li>
            <Enlace href="/">Inicio</Enlace>
          </li>
          <li>
            <Enlace href="/catalogo">Catálogo</Enlace>
          </li>
          <li aria-current="page">{producto.nombre}</li>
        </ol>
      </nav>

      <div className={styles.cuerpo}>
        <div className={styles.galeria}>
          {/* LCP de la ficha: `prioridad`. Sin foto, MarcoImagen pinta el hueco. */}
          <MarcoImagen
            variante="ficha"
            imagen={producto.imagen}
            prioridad
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={styles.foto}
          />
        </div>

        <div className={styles.detalle}>
          <header className={styles.encabezado}>
            {/* Procedencia: dato del producto, no antetítulo decorativo. */}
            <p className={styles.marca}>{producto.marca}</p>
            <h1 className={styles.titulo} tabIndex={-1}>
              {producto.nombre}
            </h1>
            {producto.novedad ? (
              <div>
                <Etiqueta variante="acento">Nuevo</Etiqueta>
              </div>
            ) : null}
            <p className={styles.entradilla}>{producto.descripcion}</p>
          </header>

          <dl className={styles.datos}>
            <div className={styles.dato}>
              <dt>Familia</dt>
              <dd>{nombreFamilia(producto.familia)}</dd>
            </div>
            <div className={styles.dato}>
              <dt>Tamaño</dt>
              <dd className="cifras">{producto.tamano}</dd>
            </div>
            {categoria ? (
              <div className={styles.dato}>
                <dt>Para</dt>
                <dd>{categoria.nombre}</dd>
              </div>
            ) : null}
          </dl>

          <div className={styles.compra}>
            <Precio
              valor={producto.precio}
              moneda={producto.moneda}
              variante="ficha"
              className={styles.precio}
            />
            <p className={styles.pago}>Pagas en efectivo cuando lo recibes. Nunca por adelantado.</p>

            {producto.disponible ? (
              <div className={styles.cta}>
                <Boton
                  variante="primario"
                  tamano="lg"
                  className={styles.ctaBoton}
                  onClick={manejarAgregarAlCarrito}
                >
                  {/* Las dos etiquetas ocupan la misma celda: el ancho no salta. */}
                  <span className={styles.ctaEtiquetas}>
                    <span className={styles.ctaEtiqueta} data-visible={!confirmacion}>
                      Añadir al carrito
                    </span>
                    <span className={styles.ctaEtiqueta} data-visible={confirmacion} aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                        <path
                          d="M3 8.5l3.2 3L13 4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="square"
                        />
                      </svg>
                      Añadido
                    </span>
                  </span>
                </Boton>
                {/* Región viva siempre presente: el lector anuncia el cambio. */}
                <p className={styles.ctaAyuda} role="status" aria-live="polite">
                  {confirmacion ? "Añadido al carrito" : ""}
                </p>
              </div>
            ) : (
              /* HU-27: agotado se muestra, pero no se compra. */
              <div className={styles.cta}>
                <Boton variante="primario" tamano="lg" className={styles.ctaBoton} disabled>
                  Agotado
                </Boton>
                <p className={styles.ctaAyuda}>Ahora mismo no lo tenemos. Vuelve a mirar en unos días.</p>
              </div>
            )}
          </div>

          <NotasOlfativas notas={producto.notas} />
        </div>
      </div>
    </article>
  );
}
