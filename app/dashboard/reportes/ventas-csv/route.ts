import { requerirAdmin } from "@/lib/auth/acceso";
import { obtenerTasaVigente } from "@/lib/moneda/repositorio";
import { rangoConsulta, resolverPeriodo, ventasCsv, ventasDelPeriodo } from "@/lib/reportes/agregados";
import { ventasEntregadas } from "@/lib/reportes/ventas";

/**
 * GET /dashboard/reportes/ventas-csv?desde=AAAA-MM-DD&hasta=AAAA-MM-DD (HU-58):
 * un pedido entregado por fila, con la fecha de entrega en hora de Cuba.
 * Protegido por el proxy (matcher /dashboard/:path*) y por requerirAdmin().
 */
export async function GET(request: Request): Promise<Response> {
  await requerirAdmin();
  const url = new URL(request.url);
  const periodo = resolverPeriodo({
    periodo: "personalizado",
    desde: url.searchParams.get("desde") ?? undefined,
    hasta: url.searchParams.get("hasta") ?? undefined,
  });
  const [{ ventas }, tasa] = await Promise.all([ventasEntregadas(rangoConsulta(periodo)), obtenerTasaVigente()]);
  const filas = ventasDelPeriodo(ventas, periodo).sort((a, b) => a.entregadoEn.getTime() - b.entregadoEn.getTime());
  return new Response(ventasCsv(filas, tasa?.cupPorUsd ?? null), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas-peache-${periodo.desde}_${periodo.hasta}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
