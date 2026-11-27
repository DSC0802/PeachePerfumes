import Precio from "@/components/ui/Precio";
import type { ResumenPanel } from "@/lib/admin/metricas";
import { UMBRAL_STOCK_BAJO } from "@/lib/admin/tipos";
import MetricaTarjeta from "./MetricaTarjeta";
import styles from "./IndicadoresResumen.module.css";

/** 4 KPI reales del panel (F3-C). Sin ventas: llegan con los pedidos (F3-D). */
export default function IndicadoresResumen({ resumen }: { resumen: ResumenPanel }) {
  return (
    <div className={styles.rejilla}>
      <MetricaTarjeta
        titulo="Productos en catálogo"
        valor={resumen.enCatalogo}
        detalle={`${resumen.totalProductos} en total · ${resumen.ocultos} ocultos`}
        tono="acento"
      />
      <MetricaTarjeta
        titulo="Valor del inventario"
        valor={<Precio valor={resumen.valorInventarioUsd} variante="nota" />}
        detalle={`${resumen.unidadesEnStock} unidades en stock`}
        tono="exito"
      />
      <MetricaTarjeta
        titulo="Stock bajo"
        valor={resumen.stockBajo.length}
        detalle={`≤ ${UMBRAL_STOCK_BAJO} unidades · ${resumen.sinStock} sin stock`}
        tono={resumen.stockBajo.length > 0 ? "aviso" : "neutral"}
      />
      <MetricaTarjeta
        titulo="Clientes registrados"
        valor={resumen.clientes}
        detalle={`${resumen.altasSemanales.at(-1)?.valor ?? 0} esta semana`}
      />
    </div>
  );
}
