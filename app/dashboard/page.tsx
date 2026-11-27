import type { Metadata } from "next";
import AvisoFuenteDemo from "@/components/dashboard/AvisoFuenteDemo";
import GraficoBarras from "@/components/dashboard/GraficoBarras";
import IndicadoresResumen from "@/components/dashboard/IndicadoresResumen";
import IndiceSecciones from "@/components/dashboard/IndiceSecciones";
import panel from "@/components/dashboard/Panel.module.css";
import TablaStockBajo from "@/components/dashboard/TablaStockBajo";
import TopValorInventario from "@/components/dashboard/TopValorInventario";
import Boton from "@/components/ui/Boton";
import VentasResumen from "@/components/dashboard/VentasResumen";
import { cargarResumen } from "@/lib/admin/datos-panel";
import { requerirAdmin } from "@/lib/auth/acceso";
import { obtenerTasaVigente } from "@/lib/moneda/repositorio";
import {
  agruparVentas,
  claveDia,
  rangoConsulta,
  sumarDias,
  totales,
  ventasDelPeriodo,
  type Periodo,
} from "@/lib/reportes/agregados";
import { recuentoPorEstado, ventasEntregadas } from "@/lib/reportes/ventas";

export const metadata: Metadata = {
  title: "Panel de administración",
};

/** /dashboard: ventas (F3-E) y resumen de catálogo, inventario y clientes (F3-C). */
export default async function PaginaDashboard() {
  const hoy = claveDia(new Date());
  const ultimos14: Periodo = { clave: "personalizado", desde: sumarDias(hoy, -13), hasta: hoy };
  const delMes: Periodo = { clave: "mes", desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
  // Una sola lectura cubre el mes y los últimos 14 días.
  const rango = rangoConsulta({ clave: "personalizado", desde: delMes.desde < ultimos14.desde ? delMes.desde : ultimos14.desde, hasta: hoy });

  const [admin, resumen, entregadas, estados, tasa] = await Promise.all([
    requerirAdmin(),
    cargarResumen(),
    ventasEntregadas(rango),
    recuentoPorEstado(),
    obtenerTasaVigente(),
  ]);
  const deHoy = totales(ventasDelPeriodo(entregadas.ventas, { clave: "personalizado", desde: hoy, hasta: hoy }));
  const delMesTotales = totales(ventasDelPeriodo(entregadas.ventas, delMes));

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <h1>Panel de administración</h1>
          <p className={panel.subtitulo}>Sesión iniciada como {admin.email}.</p>
        </div>
        <Boton href="/dashboard/productos/nuevo">Nuevo producto</Boton>
      </header>

      <AvisoFuenteDemo />
      <VentasResumen
        hoy={deHoy}
        mes={delMesTotales}
        porCobrar={estados.porCobrar}
        sinConfirmar={estados.sinConfirmar}
        ultimosDias={agruparVentas(entregadas.ventas, ultimos14, "dia")}
        tasa={tasa?.cupPorUsd ?? null}
        hayVentas={estados.cobrado.pedidos > 0}
      />
      <IndicadoresResumen resumen={resumen} />

      <div className={`${panel.rejilla} ${panel["rejilla--2"]}`}>
        <GraficoBarras
          titulo="Productos por categoría"
          nota="a la venta"
          serie={resumen.porCategoria}
          columnaValor="Productos"
        />
        <TopValorInventario top={resumen.topValor} />
      </div>

      <div className={panel.rejilla}>
        <TablaStockBajo productos={resumen.stockBajo} />
      </div>

      <section className={panel.seccion} aria-labelledby="titulo-accesos">
        <h2 id="titulo-accesos" className={panel.tarjeta__titulo} style={{ marginBlockEnd: "var(--space-4)" }}>
          Accesos rápidos
        </h2>
        <IndiceSecciones
          tarjetas={[
            {
              titulo: "Productos",
              descripcion: "Crear, editar, ocultar y cambiar el estado o el stock de los perfumes.",
              href: "/dashboard/productos",
            },
            {
              titulo: "Reportes",
              descripcion: "Catálogo, inventario y clientes con exportación a CSV.",
              href: "/dashboard/reportes",
            },
            {
              titulo: "Pedidos",
              descripcion: "Los pedidos de la tienda: detalle, historial y cambio de estado.",
              href: "/dashboard/pedidos",
            },
          ]}
        />
      </section>
    </>
  );
}
