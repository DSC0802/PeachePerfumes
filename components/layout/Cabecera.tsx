"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ConmutadorTema from "@/components/theme/ConmutadorTema";
import ConmutadorMoneda from "@/components/moneda/ConmutadorMoneda";
import Carrito from "@/components/carrito/Carrito";
import { useCarrito } from "@/components/carrito/CarritoContexto";
import HojaModal from "@/components/ui/HojaModal";
import Marca from "@/components/ui/Marca";
import Navegacion from "./Navegacion";
import CuentaAcciones, { type CuentaCabecera } from "./CuentaAcciones";
import styles from "./Cabecera.module.css";

export interface CabeceraProps {
  cuenta?: CuentaCabecera | null;
}

export default function Cabecera({ cuenta }: CabeceraProps = {}) {
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
          <ConmutadorMoneda />
          <ConmutadorTema />
          <CuentaAcciones cuenta={cuenta ?? null} />
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
              {/* Bolsa de compra */}
              <path d="M4.5 6.5h11l-.8 10.2a1 1 0 0 1-1 .8H6.3a1 1 0 0 1-1-.8z" />
              <path d="M7.5 8.5V5.5a2.5 2.5 0 0 1 5 0v3" />
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
        <CuentaAcciones
          cuenta={cuenta ?? null}
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
        <Carrito alNavegar={() => setCarritoAbierto(false)} />
      </HojaModal>
    </header>
  );
}
