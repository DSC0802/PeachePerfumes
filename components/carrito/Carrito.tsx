"use client";

import type { ItemCarrito } from "./CarritoContexto";
import { useCarrito } from "./CarritoContexto";
import Boton from "@/components/ui/Boton";
import Enlace from "@/components/ui/Enlace";
import EstadoVacio from "@/components/ui/EstadoVacio";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import styles from "./Carrito.module.css";

const MONEDA_DEFECTO = "USD";

// F3-D: el pedido se confirma en /pedido y el vale se envía por WhatsApp.
const MICROCOPY_PAGO =
  "Pagas en efectivo al recibirlo. Al confirmar, nos envías el vale por WhatsApp para acordar la entrega.";

function Linea({ linea }: { linea: ItemCarrito }) {
  const { producto, cantidad } = linea;
  const { actualizarCantidad, removerProducto } = useCarrito();
  const subtotal = producto.precio * cantidad;

  return (
    <article className={styles.item}>
      <div className={styles.imagen}>
        <MarcoImagen
          variante="tarjeta"
          imagen={{ src: producto.imagen.src }}
          className={styles.imagenMarco}
        />
      </div>
      <div className={styles.datos}>
        <h3 className={styles.nombre}>{producto.nombre}</h3>
        <p className={styles.meta}>{`${producto.marca} · ${producto.tamano}`}</p>
      </div>
      <div className={styles.precioUnitario}>
        {/* Solo con varias unidades: con una, coincidiría con el subtotal. */}
        {cantidad > 1 ? (
          <>
            <Precio valor={producto.precio} moneda={producto.moneda} variante="nota" />
            <span className={styles.porUnidad}>c/u</span>
          </>
        ) : null}
      </div>
      <div className={styles.subtotal}>
        <Precio valor={subtotal} moneda={producto.moneda} variante="tarjeta" />
      </div>
      <div className={styles.cantidad}>
        <button
          type="button"
          className={styles.botonAjuste}
          aria-label="Disminuir cantidad"
          onClick={() => actualizarCantidad(producto.id, cantidad - 1)}
        >
          −
        </button>
        <span className={styles.cantidadNumero}>{cantidad}</span>
        <button
          type="button"
          className={styles.botonAjuste}
          aria-label="Aumentar cantidad"
          onClick={() => actualizarCantidad(producto.id, cantidad + 1)}
        >
          +
        </button>
      </div>
      <Boton variante="terciario" onClick={() => removerProducto(producto.id)}>
        Quitar
      </Boton>
    </article>
  );
}

/** `alNavegar`: lo llama «Confirmar pedido» para que el cajón se cierre al salir. */
export default function Carrito({ alNavegar }: { alNavegar?: () => void } = {}) {
  const { items, obtenerTotal, totalItems, limpiarCarrito } = useCarrito();
  const moneda = items.length > 0 ? items[0].producto.moneda : MONEDA_DEFECTO;

  if (items.length === 0) {
    return (
      <EstadoVacio
        icono={
          <svg
            width="48"
            height="48"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4.5 6.5h11l-.8 10.2a1 1 0 0 1-1 .8H6.3a1 1 0 0 1-1-.8z" />
            <path d="M7.5 8.5V5.5a2.5 2.5 0 0 1 5 0v3" />
          </svg>
        }
        titulo="Tu carrito está vacío"
        apoyo="Aún no has añadido ningún perfume. Explora el catálogo y elige los que te gusten."
      >
        <Enlace href="/catalogo">Ir al catálogo</Enlace>
      </EstadoVacio>
    );
  }

  return (
    <>
      <div className={styles.lista}>
        {items.map((linea) => (
          <Linea key={linea.producto.id} linea={linea} />
        ))}
      </div>
      <div className={styles.resumen}>
        <div className={styles.totalFila}>
          <span className={styles.totalEtiqueta}>
            Total ({totalItems} {totalItems === 1 ? "artículo" : "artículos"})
          </span>
          <Precio
            valor={obtenerTotal()}
            moneda={moneda}
            variante="ficha"
            className={styles.totalImporte}
          />
        </div>
        <div className={styles.acciones}>
          {/* Acción destructiva en segundo plano: no debe competir con el pago. */}
          <Boton variante="terciario" onClick={limpiarCarrito} className={styles.vaciar}>
            Vaciar carrito
          </Boton>
          <div className={styles.pago}>
            <Boton variante="primario" tamano="lg" href="/pedido" onClick={alNavegar}>
              Confirmar pedido
            </Boton>
            <p className={styles.microcopy}>{MICROCOPY_PAGO}</p>
          </div>
        </div>
      </div>
    </>
  );
}
