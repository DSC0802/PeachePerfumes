import type { Serie } from "@/lib/admin/metricas";
import { formatearNumero } from "@/lib/moneda/formato";
import panel from "./Panel.module.css";
import styles from "./GraficoBarras.module.css";

export interface GraficoBarrasProps {
  titulo: string;
  serie: Serie[];
  /** Nota bajo el título (qué se cuenta y sobre qué base). */
  nota?: string;
  /** Formato del valor (por defecto, número entero). */
  formato?: (valor: number) => string;
  /** Columnas verticales (series temporales) en vez de barras horizontales. */
  vertical?: boolean;
  /** Encabezado de la columna de valores en la tabla accesible. */
  columnaValor?: string;
}

const numero = { format: (v: number) => formatearNumero(v, Number.isInteger(v) ? 0 : 2) };

/**
 * Gráfico de barras en CSS puro (F3-C, sin dependencias). Adaptado del antiguo
 * GraficoVentas: ahora recibe datos reales. Las barras son decorativas
 * (`aria-hidden`); la misma información va en una tabla para lectores de pantalla.
 */
export default function GraficoBarras({
  titulo,
  serie,
  nota,
  formato = (v) => numero.format(v),
  vertical = false,
  columnaValor = "Valor",
}: GraficoBarrasProps) {
  const maximo = Math.max(0, ...serie.map((s) => s.valor));
  const ancho = (v: number) => (maximo === 0 ? 0 : Math.max(2, (v / maximo) * 100));
  const total = serie.reduce((s, x) => s + x.valor, 0);

  return (
    <figure className={`${panel.tarjeta} ${styles.figura}`}>
      <figcaption className={panel.tarjeta__cabecera}>
        <span className={panel.tarjeta__titulo}>{titulo}</span>
        {nota ? <span className={panel.tarjeta__nota}>{nota}</span> : null}
      </figcaption>

      {total === 0 ? (
        <p className={panel.vacio}>Todavía no hay datos.</p>
      ) : vertical ? (
        <div className={styles.columnas} aria-hidden="true">
          {serie.map((s) => (
            <div key={s.etiqueta} className={styles.columna}>
              <span className={styles.columna__valor}>{s.valor > 0 ? formato(s.valor) : ""}</span>
              <div className={styles.columna__pista}>
                <div className={styles.columna__relleno} style={{ height: `${ancho(s.valor)}%` }} />
              </div>
              <span className={styles.columna__etiqueta}>{s.etiqueta}</span>
            </div>
          ))}
        </div>
      ) : (
        <ul className={styles.barras} aria-hidden="true">
          {serie.map((s) => (
            <li key={s.etiqueta} className={styles.fila}>
              <span className={styles.etiqueta}>{s.etiqueta}</span>
              <span className={panel.barra}>
                <span className={panel.barra__relleno} style={{ width: `${ancho(s.valor)}%` }} />
              </span>
              <span className={styles.valor}>{formato(s.valor)}</span>
            </li>
          ))}
        </ul>
      )}

      <table className="solo-lectura">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Concepto</th>
            <th scope="col">{columnaValor}</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((s) => (
            <tr key={s.etiqueta}>
              <th scope="row">{s.etiqueta}</th>
              <td>{formato(s.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
