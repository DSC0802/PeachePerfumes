import type { ReactNode } from "react";
import styles from "./MetricaTarjeta.module.css";

export type TonoMetrica = "neutral" | "acento" | "exito" | "aviso";

export interface MetricaTarjetaProps {
  titulo: string;
  /** Valor ya formateado (texto o `<Precio>`). */
  valor: ReactNode;
  /** Contexto real del dato (p. ej. «de 14 en catálogo»). Nunca una tendencia inventada. */
  detalle?: string;
  tono?: TonoMetrica;
}

/** KPI del panel (F3-C): rótulo en versalitas, cifra grande y su contexto. «aviso» engruesa la cifra; el detalle explica por qué. */
export default function MetricaTarjeta({
  titulo,
  valor,
  detalle,
  tono = "neutral",
}: MetricaTarjetaProps) {
  return (
    <article className={`${styles.tarjeta} ${styles[`tarjeta--${tono}`]}`}>
      <h2 className={styles.titulo}>{titulo}</h2>
      <div className={styles.valor}>{valor}</div>
      {detalle ? <p className={styles.detalle}>{detalle}</p> : null}
    </article>
  );
}
