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

const formateadores = new Map<string, Intl.NumberFormat>();

/**
 * Formato con `Intl.NumberFormat("es-CU", { style: "currency" })` — el
 * separador, símbolo y decimales los decide la librería, nunca concatenar.
 * Si el código de moneda no es válido, se degrada al número sin símbolo.
 */
function formatear(valor: number, moneda: string): string {
  let formateador = formateadores.get(moneda);
  if (!formateador) {
    try {
      formateador = new Intl.NumberFormat("es-CU", {
        style: "currency",
        currency: moneda,
      });
    } catch {
      formateador = new Intl.NumberFormat("es-CU", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
    formateadores.set(moneda, formateador);
  }
  return formateador.format(valor);
}

export default function Precio({
  valor,
  moneda = "USD",
  variante = "tarjeta",
  nota,
  className,
}: PrecioProps) {
  const clases = [styles.precio, styles[`precio--${variante}`], className].filter(Boolean).join(" ");
  const formateado = formatear(valor, moneda);

  return (
    <p className={clases}>
      <data value={valor.toFixed(2)}>{formateado}</data>
      {/* El símbolo `$` es ambiguo (USD/CUP/MLC): la unidad se lee aparte */}
      <span className="solo-lectura"> {moneda}</span>
      {nota ? <span className={styles.nota}>{nota}</span> : null}
    </p>
  );
}
