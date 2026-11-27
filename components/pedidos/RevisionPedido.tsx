"use client";

import { startTransition, useActionState, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useCarrito } from "@/components/carrito/CarritoContexto";
import Boton from "@/components/ui/Boton";
import EstadoVacio from "@/components/ui/EstadoVacio";
import Precio from "@/components/ui/Precio";
import {
  confirmarPedido,
  revisarPedido,
  type EstadoConfirmacion,
  type RespuestaRevision,
} from "@/lib/pedidos/acciones";
import type { AvisoLinea, ValeRevisado } from "@/lib/pedidos/revision";
import { formatearImporte } from "@/lib/moneda/formato";
import styles from "./Pedido.module.css";

const sinSuscripcion = () => () => {};



function textoAviso(aviso: AvisoLinea): string {
  switch (aviso.tipo) {
    case "precio":
      return `El precio cambió: antes ${formatearImporte(aviso.antes, "USD")}, ahora ${formatearImporte(aviso.ahora, "USD")}.`;
    case "cantidad":
      return `Sólo quedan ${aviso.ahora}: pediste ${aviso.antes}.`;
    case "no_disponible":
      return "Ya no está disponible: no entra en el pedido.";
  }
}

/** El vale revisado (HU-31): líneas, avisos y total. */
function Vale({ vale }: { vale: ValeRevisado }) {
  return (
    <>
      <ul className={styles.lineas}>
        {vale.lineas.map((linea) => (
          <li key={linea.slug} className={linea.incluida ? styles.linea : `${styles.linea} ${styles.lineaFuera}`}>
            <span className={`${styles.cantidad} cifras`}>{linea.incluida ? `${linea.cantidad} ×` : "—"}</span>
            <span className={styles.nombreLinea}>
              {linea.nombre}
              <span className={styles.secundario}>
                {[linea.marca, linea.tamano].filter(Boolean).join(" · ")}
              </span>
              {linea.avisos.map((aviso) => (
                <span key={aviso.tipo} className={styles.aviso}>
                  {textoAviso(aviso)}
                </span>
              ))}
            </span>
            <span className={styles.importeLinea}>
              {linea.incluida ? <Precio valor={linea.subtotalUsd} variante="tarjeta" /> : null}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.total}>
        <span>Total</span>
        <Precio valor={vale.totalUsd} variante="ficha" className={styles.totalCifra} />
      </div>
    </>
  );
}

/**
 * Revisión y confirmación del pedido (F3-D, HU-31/32). El carrito vive en el
 * navegador; el servidor revalida precio, disponibilidad y stock antes de
 * dejar confirmar, y otra vez dentro de la transacción al crear el pedido.
 */
export default function RevisionPedido() {
  const { items } = useCarrito();
  // El carrito vive en localStorage: en el servidor siempre está vacío.
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const lineas = useMemo(
    () => items.map((i) => ({ slug: i.producto.slug, cantidad: i.cantidad, precioVisto: i.producto.precio })),
    [items],
  );
  const [revision, setRevision] = useState<RespuestaRevision | null>(null);
  const [fallo, setFallo] = useState(false);
  // Una clave por intento de compra: repetir el envío no duplica el pedido.
  const [clave] = useState(() => crypto.randomUUID());
  const [estado, accion, enviando] = useActionState<EstadoConfirmacion, FormData>(confirmarPedido, {});

  const clavesCarrito = JSON.stringify(lineas);
  useEffect(() => {
    if (lineas.length === 0) return;
    let vigente = true;
    revisarPedido(lineas)
      .then((r) => vigente && setRevision(r))
      .catch(() => vigente && setFallo(true));
    return () => {
      vigente = false;
    };
    // Se revisa de nuevo sólo si cambia el contenido del carrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clavesCarrito]);

  if (!montado) {
    return (
      <p className={styles.cargando} role="status">
        Revisando precios y disponibilidad…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu carrito está vacío"
        apoyo="Añade algún perfume y vuelve aquí para confirmar el pedido."
        nivelTitulo="h2"
      >
        <Boton variante="secundario" href="/catalogo">
          Ver el catálogo
        </Boton>
      </EstadoVacio>
    );
  }

  if (fallo) {
    return (
      <p className={styles.error} role="alert">
        No pudimos revisar el pedido. Revisa tu conexión y recarga la página.
      </p>
    );
  }

  // Si la confirmación detectó cambios, manda el vale que devolvió el servidor.
  const vale = estado.vale ?? revision?.vale;
  if (!revision || !vale) {
    return (
      <p className={styles.cargando} role="status">
        Revisando precios y disponibilidad…
      </p>
    );
  }

  const incluidas = vale.lineas
    .filter((l) => l.incluida)
    .map((l) => ({ slug: l.slug, cantidad: l.cantidad, precioVisto: l.precioUsd }));

  return (
    <div className={styles.vale}>
      <header className={styles.valeCabecera}>
        <p className={styles.valeTipo}>Vale de pedido</p>
        <p className={`${styles.valeTipo} ${styles.pagoRotulo}`}>Pagas al recibir</p>
      </header>

      {vale.conCambios ? (
        <p className={styles.avisoGeneral} role="status">
          Algunos perfumes cambiaron desde que los añadiste. Revisa el vale antes de confirmar.
        </p>
      ) : null}

      <Vale vale={vale} />

      <p className={styles.nota}>
        Pagas en efectivo al recibirlo. La entrega, su costo si lo hay y la moneda de pago se acuerdan por
        WhatsApp.
      </p>

      {estado.error ? (
        <p className={styles.error} role="alert">
          {estado.error}
        </p>
      ) : null}

      {!revision.tiendaLista ? (
        <p className={styles.error} role="alert">
          La tienda todavía no puede recibir pedidos. Inténtalo más tarde.
        </p>
      ) : (
        <form
          action={accion}
          onSubmit={(evento) => {
            evento.preventDefault();
            const datos = new FormData(evento.currentTarget);
            startTransition(() => accion(datos));
          }}
        >
          <input type="hidden" name="clave" value={clave} />
          <input type="hidden" name="lineas" value={JSON.stringify(incluidas)} />
          <Boton
            type="submit"
            tamano="lg"
            className={styles.confirmar}
            loading={enviando}
            disabled={enviando || !vale.confirmable}
          >
            {enviando ? "Confirmando…" : "Confirmar pedido"}
          </Boton>
        </form>
      )}
    </div>
  );
}
