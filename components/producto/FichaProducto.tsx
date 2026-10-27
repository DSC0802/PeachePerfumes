"use client";

import type { Categoria, Producto } from "@/lib/catalogo";
import { nombreFamilia } from "@/components/landing/familias";
import { useState } from "react";
import Boton from "@/components/ui/Boton";
import Enlace from "@/components/ui/Enlace";
import Etiqueta from "@/components/ui/Etiqueta";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import { useCarrito } from "@/components/carrito/CarritoContexto";
import NotasOlfativas from "./NotasOlfativas";
import styles from "./FichaProducto.module.css";

/**
 * §3.2 de `estados-y-responsividad.md` — anatomía de `/producto/[slug]`:
 * migas → galería `1/1` → `h1` + badge → meta (familia · envase) → precio
 * (variante ficha) + CTA + ayuda → descripción → pirámide olfativa.
 * Mobile-first apilado; `≥1024px` dos columnas `1.1fr / 0.9fr` con la galería
 * sticky (§3.2 «Responsive»). Un único `h1` (el nombre del perfume) y
 * jerarquía `h2`/`h3` sin saltos (arquitectura §8). El dinero se pinta SÓLO
 * con `Precio` (D-DINERO-1); la marca no se inventa ni se concatena.
 *
 * El CTA "Añadir al carrito" es ahora funcional (estado local del carrito,
 * clave `peache-carrito`) y confirma la adición con un estado temporal.
 */
export interface FichaProductoProps {
  producto: Producto;
  /** `null` si `categoriaId` no resuelve: se omite el badge y nada más. */
  categoria: Categoria | null;
}

export default function FichaProducto({
  producto,
  categoria,
}: FichaProductoProps) {
  const { agregarProducto } = useCarrito();
  const [confirmacion, setConfirmacion] = useState(false);

  const manejarAgregarAlCarrito = () => {
    agregarProducto(producto);
    setConfirmacion(true);
    setTimeout(() => setConfirmacion(false), 2500);
  };
  return (
    <article className={styles.ficha}>
      {/* §3.2.1 — migas: Inicio / Catálogo / {nombre}; el último, texto plano */}
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
          {/* §3.2.2 + §14: imagen principal `1/1`, alt real del dato y
              `prioridad` porque es el LCP de la ficha (§14.6). Las fotos no
              existen a propósito (D-IMAGENES): MarcoImagen pinta el
              placeholder con el imagotipo «PP» (D-MONOGRAMA). */}
          <MarcoImagen variante="ficha" imagen={producto.imagen} prioridad />
        </div>

        <div className={styles.detalle}>
          <header className={styles.encabezado}>
            <p className={styles.marca}>{producto.marca}</p>
            <div className={styles.tituloFila}>
              <h1 className={styles.titulo} tabIndex={-1}>
                {producto.nombre}
              </h1>
              {producto.novedad ? (
                <Etiqueta variante="acento">Nuevo</Etiqueta>
              ) : null}
            </div>
            {/* §3.2.4 — meta: familia · envase + badge neutral de categoría (§4) */}
            <p className={styles.meta}>
              {`${nombreFamilia(producto.familia)} · ${producto.tamano}`}
              {categoria ? (
                <Etiqueta variante="neutral">{categoria.nombre}</Etiqueta>
              ) : null}
            </p>
          </header>

          {/* §3.2.5 — precio (variante ficha, §10) + CTA de carrito demo:
              acción funcional que añade al carrito de estado local y confirma
              con un estado temporal. El pago online sigue no disponible. */}
          <div className={styles.compra}>
            <Precio valor={producto.precio} moneda={producto.moneda} variante="ficha" />
            <div className={styles.cta}>
              <Boton variante="primario" onClick={manejarAgregarAlCarrito}>
                Añadir al carrito
              </Boton>
              {confirmacion ? (
                <p className={styles.ctaConfirmacion} role="status" aria-live="polite">
                  Añadido al carrito
                </p>
              ) : (
                <p className={styles.ctaAyuda}>
                  La compra online estará disponible próximamente.
                </p>
              )}
            </div>
          </div>

          <section
            className={styles.descripcion}
            aria-labelledby="ficha-descripcion"
          >
            <h2 id="ficha-descripcion" className={styles.subtitulo}>
              Descripción olfativa
            </h2>
            <p className={styles.texto}>{producto.descripcion}</p>
          </section>

          <NotasOlfativas notas={producto.notas} />
        </div>
      </div>
    </article>
  );
}
