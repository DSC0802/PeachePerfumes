"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ConmutadorTema from "@/components/theme/ConmutadorTema";
import Carrito from "@/components/carrito/Carrito";
import { useCarrito } from "@/components/carrito/CarritoContexto";
import HojaModal from "@/components/ui/HojaModal";
import Marca from "@/components/ui/Marca";
import Navegacion from "./Navegacion";
import styles from "./Cabecera.module.css";

/**
 * §5 de docs/design/componentes.md — Cabecera + menú móvil.
 * Sticky, altura por token; orden visual y de foco: logo → nav → acciones.
 * El selector de tema siempre visible en todos los breakpoints (§5).
 * Ahora incluye el acceso al carrito (estado local, clave `peache-carrito`).
 */
export default function Cabecera() {
  const rutaActual = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const { totalItems } = useCarrito();
  const etiquetaMenu = menuAbierto ? "Cerrar menú" : "Abrir menú";
  const etiquetaCarrito = `Carrito, ${totalItems} ${
    totalItems === 1 ? "artículo" : "artículos"
  }`;

  return (
    <header className={styles.cabecera}>
      <div className={styles.interior}>
        <Link
          href="/"
          className={styles.logo}
          aria-label="Peache PERFUMES — inicio"
        >
          <Marca />
        </Link>

        <div className={styles.navEscritorio}>
          <Navegacion rutaActual={rutaActual} orientacion="horizontal" />
        </div>

        <div className={styles.acciones}>
          <ConmutadorTema />
          <button
            type="button"
            className={styles.menu}
            aria-label={etiquetaMenu}
            title={etiquetaMenu}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M3 5.5h14M3 10h14M3 14.5h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={styles.carrito}
            aria-label={etiquetaCarrito}
            aria-haspopup="dialog"
            onClick={() => setCarritoAbierto(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="4" cy="16" r="1.5" />
              <circle cx="15" cy="16" r="1.5" />
              <path d="M2 12h2l1 4h10l1-4h2" />
              <path d="M8.5 12h3v-2h-3z" />
            </svg>
            {totalItems > 0 && (
              <span className={styles.insignia} aria-hidden="true">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <HojaModal
        id="menu-movil"
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        titulo="Menú"
        etiquetaCerrar="Cerrar menú"
        variante="lateral"
      >
        <Navegacion
          rutaActual={rutaActual}
          orientacion="vertical"
          onNavegar={() => setMenuAbierto(false)}
        />
      </HojaModal>

      <HojaModal
        id="carrito"
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        titulo="Tu carrito"
        etiquetaCerrar="Cerrar carrito"
        variante="inferior"
      >
        <Carrito />
      </HojaModal>
    </header>
  );
}
