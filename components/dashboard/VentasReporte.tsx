import Link from "next/link";
import tabla from "@/components/admin/TablaProductos.module.css";
import Boton from "@/components/ui/Boton";
import { formatearImporte, formatearNumero } from "@/lib/moneda/formato";
import {
  NOMBRE_PERIODO,
  PERIODOS,
  type Agrupacion,
  type Cubo,
  type MasVendido,
  type Periodo,
  type Totales,
} from "@/lib/reportes/agregados";
import type { RecuentoEstado } from "@/lib/reportes/ventas";
import GraficoBarras from "./GraficoBarras";
import ImporteDoble from "./ImporteDoble";
import MetricaTarjeta from "./MetricaTarjeta";
import panel from "./Panel.module.css";

const NOMBRE_AGRUPACION: Record<Agrupacion, string> = { dia: "Por día", semana: "Por semana", mes: "Por mes" };

function fechaLegible(clave: string): string {
  return `${clave.slice(8, 10)}/${clave.slice(5, 7)}/${clave.slice(0, 4)}`;
}

/** Sección «Ventas» de Reportes (F3-E, HU-55/56/57/58). */
export default function VentasReporte({
  periodo,
  agrupacion,
  cubos,
  totalesPeriodo,
  top,
  estados,
  tasa,
}: {
  periodo: Periodo;
  agrupacion: Agrupacion;
  cubos: Cubo[];
  totalesPeriodo: Totales;
  top: MasVendido[];
  estados: { cobrado: RecuentoEstado; porCobrar: RecuentoEstado; cancelado: RecuentoEstado };
  tasa: number | null;
}) {
  const csv = `/dashboard/reportes/ventas-csv?desde=${periodo.desde}&hasta=${periodo.hasta}`;
  const conVentas = cubos.filter((c) => c.pedidos > 0);

  return (
    <section aria-labelledby="titulo-reporte-ventas" className={panel.rejilla} style={{ marginBlockEnd: "var(--space-7)" }}>
      <div className={panel.encabezado} style={{ marginBlockEnd: 0 }}>
        <div>
          <h2 id="titulo-reporte-ventas" style={{ fontSize: "var(--font-size-h3)" }}>
            Ventas
          </h2>
          <p className={panel.subtitulo}>
            {NOMBRE_PERIODO[periodo.clave]}: del {fechaLegible(periodo.desde)} al {fechaLegible(periodo.hasta)} · pedidos
            entregados, hora de Cuba.
          </p>
        </div>
        <Boton href={csv} variante="secundario">
          Exportar ventas (CSV)
        </Boton>
      </div>

      <form className={tabla.filtros} method="get" role="search" aria-label="Período de ventas">
        <div className={tabla.campo}>
          <label htmlFor="ventas-periodo">Período</label>
          <select id="ventas-periodo" name="periodo" defaultValue={periodo.clave}>
            {PERIODOS.map((p) => (
              <option key={p} value={p}>
                {NOMBRE_PERIODO[p]}
              </option>
            ))}
          </select>
        </div>
        <div className={tabla.campo}>
          <label htmlFor="ventas-desde">Desde (personalizado)</label>
          <input id="ventas-desde" name="desde" type="date" defaultValue={periodo.desde} />
        </div>
        <div className={tabla.campo}>
          <label htmlFor="ventas-hasta">Hasta (personalizado)</label>
          <input id="ventas-hasta" name="hasta" type="date" defaultValue={periodo.hasta} />
        </div>
        <div className={tabla.campo}>
          <label htmlFor="ventas-agrupacion">Agrupar</label>
          <select id="ventas-agrupacion" name="agrupar" defaultValue={agrupacion}>
            {(Object.keys(NOMBRE_AGRUPACION) as Agrupacion[]).map((a) => (
              <option key={a} value={a}>
                {NOMBRE_AGRUPACION[a]}
              </option>
            ))}
          </select>
        </div>
        <div className={tabla.acciones}>
          <Boton type="submit" variante="secundario">
            Ver
          </Boton>
          <Link href="/dashboard/reportes">Restablecer</Link>
        </div>
      </form>

      <div className={panel.rejilla} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13rem), 1fr))" }}>
        <MetricaTarjeta
          titulo="Ingresos del período"
          valor={<ImporteDoble usd={totalesPeriodo.totalUsd} tasa={tasa} />}
          detalle={`${totalesPeriodo.pedidos} ${totalesPeriodo.pedidos === 1 ? "pedido" : "pedidos"} · ${formatearNumero(totalesPeriodo.unidades)} unidades`}
          tono="exito"
        />
        <MetricaTarjeta
          titulo="Ticket medio"
          valor={<ImporteDoble usd={totalesPeriodo.ticketMedioUsd} tasa={tasa} />}
          detalle="ingresos ÷ pedidos entregados"
        />
        <MetricaTarjeta
          titulo="Pendiente de cobro"
          valor={<ImporteDoble usd={estados.porCobrar.totalUsd} tasa={tasa} />}
          detalle={`${estados.porCobrar.pedidos} pedidos en curso creados en el período`}
          tono="aviso"
        />
        <MetricaTarjeta
          titulo="Cancelado"
          valor={<ImporteDoble usd={estados.cancelado.totalUsd} tasa={tasa} />}
          detalle={`${estados.cancelado.pedidos} pedidos cancelados en el período`}
        />
      </div>

      <div className={`${panel.rejilla} ${panel["rejilla--2"]}`}>
        <GraficoBarras
          titulo="Ingresos por período"
          nota={`${NOMBRE_AGRUPACION[agrupacion].toLowerCase()} · USD`}
          serie={cubos.map((c) => ({ etiqueta: c.etiqueta, valor: c.totalUsd }))}
          formato={(v) => formatearImporte(v, "USD")}
          vertical
          columnaValor="Ingresos (USD)"
        />

        <section className={panel.tarjeta} aria-labelledby="titulo-mas-vendidos">
          <div className={panel.tarjeta__cabecera}>
            <h3 id="titulo-mas-vendidos" className={panel.tarjeta__titulo}>
              Más vendidos
            </h3>
            <p className={panel.tarjeta__nota}>top 10 por unidades</p>
          </div>
          {top.length === 0 ? (
            <p className={panel.vacio}>Sin ventas en este período.</p>
          ) : (
            <div className={panel.tablaContenedor} tabIndex={0} role="region" aria-labelledby="titulo-mas-vendidos">
              <table className={panel.tabla}>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col" className={panel.num}>
                      Unidades
                    </th>
                    <th scope="col" className={panel.num}>
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((p) => (
                    <tr key={p.slug}>
                      <th scope="row">{p.nombre}</th>
                      <td className={panel.num}>{p.unidades}</td>
                      <td className={`${panel.num} cifras`}>{formatearImporte(p.totalUsd, "USD")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className={panel.tarjeta} aria-labelledby="titulo-detalle-ventas">
        <div className={panel.tarjeta__cabecera}>
          <h3 id="titulo-detalle-ventas" className={panel.tarjeta__titulo}>
            Detalle por período
          </h3>
          <p className={panel.tarjeta__nota}>sólo períodos con ventas</p>
        </div>
        {conVentas.length === 0 ? (
          <p className={panel.vacio}>Sin ventas entregadas en este período.</p>
        ) : (
          <div className={panel.tablaContenedor} tabIndex={0} role="region" aria-labelledby="titulo-detalle-ventas">
            <table className={panel.tabla}>
              <thead>
                <tr>
                  <th scope="col">Período</th>
                  <th scope="col" className={panel.num}>
                    Pedidos
                  </th>
                  <th scope="col" className={panel.num}>
                    Unidades
                  </th>
                  <th scope="col" className={panel.num}>
                    Ingresos
                  </th>
                </tr>
              </thead>
              <tbody>
                {conVentas.map((c) => (
                  <tr key={c.clave}>
                    <th scope="row">{c.etiqueta}</th>
                    <td className={panel.num}>{c.pedidos}</td>
                    <td className={panel.num}>{c.unidades}</td>
                    <td className={panel.num}>
                      <ImporteDoble usd={c.totalUsd} tasa={tasa} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td className={panel.num}>{totalesPeriodo.pedidos}</td>
                  <td className={panel.num}>{totalesPeriodo.unidades}</td>
                  <td className={panel.num}>
                    <ImporteDoble usd={totalesPeriodo.totalUsd} tasa={tasa} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
