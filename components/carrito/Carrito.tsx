"use client";

import type { ItemCarrito } from "./CarritoContexto";
import { useCarrito } from "./CarritoContexto";
import Boton from "@/components/ui/Boton";
import Enlace from "@/components/ui/Enlace";
import EstadoVacio from "@/components/ui/EstadoVacio";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import styles from "./Carrito.module.css";

const MONEDA_DEFECTO = "CUP";

const MICROCOPY_PAGO =
  "La compra online estará disponible próximamente. Contáctanos por WhatsApp.";

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
        <Precio valor={producto.precio} moneda={producto.moneda} variante="nota" />
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

export default function Carrito() {
  const { items, obtenerTotal, totalItems, limpiarCarrito } = useCarrito();
  const moneda = items.length > 0 ? items[0].producto.moneda : MONEDA_DEFECTO;

  if (items.length === 0) {
    return (
      <EstadoVacio
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
          <Boton variante="peligro" onClick={limpiarCarrito}>
            Vaciar carrito
          </Boton>
          <Boton variante="primario" tamano="lg" disabled>
            Proceder al pago
          </Boton>
          <p className={styles.microcopy}>{MICROCOPY_PAGO}</p>
        </div>
      </div>
    </>
  );
}
