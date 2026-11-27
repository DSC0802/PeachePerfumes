"use client";

import { useMoneda } from "@/components/moneda/MonedaContexto";
import { importeVisible } from "@/lib/moneda/conversion";
import { formatearImporte } from "@/lib/moneda/formato";
import styles from "./Precio.module.css";

/** §10 de docs/design/componentes.md — Precio. */
export type VariantePrecio = "ficha" | "tarjeta" | "nota";

export interface PrecioProps {
  /** Valor numérico en unidades de la moneda (sin símbolo). */
  valor: number;
  /** Código ISO de la moneda del producto (dato del producto). Defecto: USD. */
  moneda?: string;
  variante?: VariantePrecio;
  /** Nota bajo el precio, sólo si el negocio la define (§10). */
  nota?: string;
  className?: string;
}

export default function Precio({
  valor,
  moneda = "USD",
  variante = "tarjeta",
  nota,
  className,
}: PrecioProps) {
  const clases = [styles.precio, styles[`precio--${variante}`], className].filter(Boolean).join(" ");
  // F3-C2 (HU-51/53): único punto de conversión. Los precios llegan en USD
  // (moneda base); si el visitante eligió CUP y hay tasa, se pinta CUP.
  const { moneda: preferencia, tasa } = useMoneda();
  const visible = moneda === "USD" ? importeVisible(valor, preferencia, tasa) : { valor, moneda };
  const convertido = visible.moneda !== moneda;
  // «47 500 CUP» / «50,00 USD» (lib/moneda/formato.ts): sin «$» ambiguo.
  const formateado = formatearImporte(visible.valor, visible.moneda);
  // En la ficha, al ver CUP se mantiene a la vista el precio base en USD.
  const notaFinal =
    nota ?? (convertido && variante === "ficha" ? `≈ ${formatearImporte(valor, moneda)}` : undefined);

  return (
    <p className={clases}>
      <data value={visible.moneda === "CUP" ? String(visible.valor) : visible.valor.toFixed(2)}>{formateado}</data>
      {notaFinal ? <span className={styles.nota}>{notaFinal}</span> : null}
    </p>
  );
}
