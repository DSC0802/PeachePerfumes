import type { Metadata } from "next";
import GraficoBarras from "@/components/dashboard/GraficoBarras";
import IndicadoresResumen from "@/components/dashboard/IndicadoresResumen";
import panel from "@/components/dashboard/Panel.module.css";
import Boton from "@/components/ui/Boton";
import Precio from "@/components/ui/Precio";
import { cargarResumen } from "@/lib/admin/datos-panel";
import { porcentaje } from "@/lib/admin/metricas";
import { formatearImporte } from "@/lib/moneda/formato";
import VentasReporte from "@/components/dashboard/VentasReporte";
import { obtenerTasaVigente } from "@/lib/moneda/repositorio";
import {
  agrupacionPorDefecto,
  claveDia,
  agruparVentas,
  masVendidos,
  rangoConsulta,
  resolverPeriodo,
  totales,
  ventasDelPeriodo,
  type Agrupacion,
} from "@/lib/reportes/agregados";
import { recuentoPorEstado, ventasEntregadas } from "@/lib/reportes/ventas";

export const metadata: Metadata = {
  title: "Reportes · Panel",
};

const usd = { format: (v: number) => formatearImporte(v, "USD") };

/** /dashboard/reportes — ventas (F3-E) y catálogo, inventario y clientes (F3-C). */
export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string; agrupar?: string }>;
}) {
  const parametros = await searchParams;
  const periodo = resolverPeriodo(parametros);
  const agrupacion: Agrupacion = ["dia", "semana", "mes"].includes(parametros.agrupar ?? "")
    ? (parametros.agrupar as Agrupacion)
    : agrupacionPorDefecto(periodo);
  const rango = rangoConsulta(periodo);

  const [resumen, entregadas, estados, tasa] = await Promise.all([
    cargarResumen(),
    ventasEntregadas(rango),
    recuentoPorEstado(rango),
    obtenerTasaVigente(),
  ]);
  const totalValor = resumen.valorInventarioUsd;
  const delPeriodo = ventasDelPeriodo(entregadas.ventas, periodo);
  const lineasDelPeriodo = entregadas.lineas.filter((l) => {
    const dia = claveDia(l.entregadoEn);
    return dia >= periodo.desde && dia <= periodo.hasta;
  });

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <h1>Reportes</h1>
          <p className={panel.subtitulo}>Datos en vivo de la base de datos. Cuentas en USD; el CUP, a la tasa de hoy.</p>
        </div>
      </header>

      <VentasReporte
        periodo={periodo}
        agrupacion={agrupacion}
        cubos={agruparVentas(entregadas.ventas, periodo, agrupacion)}
        totalesPeriodo={totales(delPeriodo)}
        top={masVendidos(lineasDelPeriodo)}
        estados={estados}
        tasa={tasa?.cupPorUsd ?? null}
      />

      <div className={panel.encabezado} style={{ marginBlockEnd: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--font-size-h3)" }}>Catálogo e inventario</h2>
        <Boton href="/dashboard/reportes/csv" variante="secundario">
          Exportar inventario (CSV)
        </Boton>
      </div>

      <IndicadoresResumen resumen={resumen} />

      <div className={`${panel.rejilla} ${panel["rejilla--2"]}`}>
        <GraficoBarras
          titulo="Productos por familia olfativa"
          nota="a la venta"
          serie={resumen.porFamilia}
          columnaValor="Productos"
        />
        <GraficoBarras
          titulo="Productos por rango de precio"
          nota="a la venta"
          serie={resumen.porRangoPrecio}
          columnaValor="Productos"
        />
        <GraficoBarras
          titulo="Valor del inventario por categoría"
          nota="precio × stock"
          serie={resumen.valorPorCategoria}
          formato={(v) => usd.format(v)}
          columnaValor="Valor (USD)"
        />
        <GraficoBarras
          titulo="Productos por estado"
          nota="visibles, incluye no vendibles"
          serie={resumen.porEstado}
          columnaValor="Productos"
        />
      </div>

      <div className={`${panel.rejilla} ${panel["rejilla--2"]}`}>
        <GraficoBarras
          titulo="Clientes nuevos por semana"
          nota="últimas 8 semanas · semanas desde el lunes"
          serie={resumen.altasSemanales}
          vertical
          columnaValor="Altas"
        />

        <section className={panel.tarjeta} aria-labelledby="titulo-categorias">
          <div className={panel.tarjeta__cabecera}>
            <h2 id="titulo-categorias" className={panel.tarjeta__titulo}>
              Inventario por categoría
            </h2>
          </div>
          <div className={panel.tablaContenedor} tabIndex={0} role="region" aria-labelledby="titulo-categorias">
            <table className={panel.tabla}>
              <thead>
                <tr>
                  <th scope="col">Categoría</th>
                  <th scope="col" className={panel.num}>
                    Productos
                  </th>
                  <th scope="col" className={panel.num}>
                    Valor
                  </th>
                  <th scope="col" className={panel.num}>
                    % del valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {resumen.porCategoria.map((c, i) => {
                  const valor = resumen.valorPorCategoria[i]?.valor ?? 0;
                  return (
                    <tr key={c.etiqueta}>
                      <th scope="row">{c.etiqueta}</th>
                      <td className={panel.num}>{c.valor}</td>
                      <td className={panel.num}>
                        <Precio valor={valor} variante="nota" />
                      </td>
                      <td className={panel.num}>{porcentaje(valor, totalValor)} %</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td className={panel.num}>{resumen.enCatalogo}</td>
                  <td className={panel.num}>
                    <Precio valor={totalValor} variante="nota" />
                  </td>
                  <td className={panel.num}>100 %</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

    </>
  );
}
