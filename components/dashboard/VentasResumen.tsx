import Link from "next/link";
import type { Cubo, Totales } from "@/lib/reportes/agregados";
import type { RecuentoEstado } from "@/lib/reportes/ventas";
import { formatearImporte } from "@/lib/moneda/formato";
import GraficoBarras from "./GraficoBarras";
import ImporteDoble from "./ImporteDoble";
import MetricaTarjeta from "./MetricaTarjeta";
import panel from "./Panel.module.css";
import styles from "./VentasResumen.module.css";

/**
 * Ventas en el resumen del panel (F3-E, HU-54): hoy, este mes, por cobrar y
 * pedidos sin confirmar, más las ventas de los últimos 14 días.
 */
export default function VentasResumen({
  hoy,
  mes,
  porCobrar,
  sinConfirmar,
  ultimosDias,
  tasa,
  hayVentas,
}: {
  hoy: Totales;
  mes: Totales;
  porCobrar: RecuentoEstado;
  sinConfirmar: number;
  ultimosDias: Cubo[];
  tasa: number | null;
  hayVentas: boolean;
}) {
  return (
    <section className={styles.ventas} aria-labelledby="titulo-ventas">
      <div className={panel.tarjeta__cabecera}>
        <h2 id="titulo-ventas" className={panel.tarjeta__titulo}>
          Ventas
        </h2>
        <p className={panel.tarjeta__nota}>pedidos entregados y cobrados · hora de Cuba</p>
      </div>

      <div className={styles.cifras}>
        <MetricaTarjeta
          titulo="Ventas de hoy"
          valor={<ImporteDoble usd={hoy.totalUsd} tasa={tasa} className={styles.importe} />}
          detalle={`${hoy.pedidos} ${hoy.pedidos === 1 ? "pedido entregado" : "pedidos entregados"}`}
          tono="exito"
        />
        <MetricaTarjeta
          titulo="Ventas del mes"
          valor={<ImporteDoble usd={mes.totalUsd} tasa={tasa} className={styles.importe} />}
          detalle={`${mes.pedidos} ${mes.pedidos === 1 ? "pedido" : "pedidos"} · ticket medio ${formatearImporte(mes.ticketMedioUsd, "USD")}`}
          tono="acento"
        />
        <MetricaTarjeta
          titulo="Por cobrar"
          valor={<ImporteDoble usd={porCobrar.totalUsd} tasa={tasa} className={styles.importe} />}
          detalle={`${porCobrar.pedidos} ${porCobrar.pedidos === 1 ? "pedido en curso" : "pedidos en curso"}`}
        />
        <MetricaTarjeta
          titulo="Sin confirmar"
          valor={sinConfirmar}
          detalle={sinConfirmar > 0 ? "esperan que hables con el cliente" : "ninguno pendiente"}
          tono={sinConfirmar > 0 ? "aviso" : "neutral"}
        />
      </div>

      {sinConfirmar > 0 ? (
        <p className={styles.enlace}>
          <Link href="/dashboard/pedidos?estado=pendiente">Ver los pedidos sin confirmar</Link>
        </p>
      ) : null}

      {hayVentas ? (
        <GraficoBarras
          titulo="Ventas de los últimos 14 días"
          nota="USD por día de entrega"
          serie={ultimosDias.map((c) => ({ etiqueta: c.etiqueta, valor: c.totalUsd }))}
          formato={(v) => formatearImporte(v, "USD")}
          vertical
          columnaValor="Ventas (USD)"
        />
      ) : (
        <div className={`${panel.tarjeta} ${styles.sinVentas}`}>
          <h3 className={panel.tarjeta__titulo}>Aún no hay ventas entregadas</h3>
          <p className={panel.vacio}>
            Cuando marques un pedido como «Entregado», aparecerá aquí con su importe.{" "}
            <Link href="/dashboard/pedidos">Ver pedidos</Link>
          </p>
        </div>
      )}
    </section>
  );
}
