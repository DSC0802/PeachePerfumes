"use client";

import { useMoneda } from "./MonedaContexto";
import type { MonedaVisible } from "@/lib/moneda/conversion";
import styles from "./ConmutadorMoneda.module.css";

const OPCIONES: MonedaVisible[] = ["USD", "CUP"];

/**
 * Conmutador USD ⇄ CUP de la cabecera (F3-C2, HU-51): dos botones con
 * `aria-pressed`. Sin tasa vigente no se muestra (la tienda sólo tiene USD).
 */
export default function ConmutadorMoneda() {
  const { moneda, tasa, cambiarMoneda } = useMoneda();
  if (tasa === null) return null;

  return (
    <div className={styles.conmutador} role="group" aria-label="Moneda de los precios">
      {OPCIONES.map((opcion) => (
        <button
          key={opcion}
          type="button"
          className={styles.opcion}
          aria-pressed={moneda === opcion}
          onClick={() => cambiarMoneda(opcion)}
        >
          {opcion}
        </button>
      ))}
    </div>
  );
}
