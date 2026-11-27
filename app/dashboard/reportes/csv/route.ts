import { inventarioCsv } from "@/lib/admin/metricas";
import { listarCategoriasAdmin, listarProductosAdmin } from "@/lib/admin/repositorio-admin";
import { requerirAdmin } from "@/lib/auth/acceso";

/**
 * GET /dashboard/reportes/csv — inventario completo (incluye ocultos).
 * Protegido por el proxy (matcher /dashboard/:path*) y por requerirAdmin().
 */
export async function GET(): Promise<Response> {
  await requerirAdmin();
  const [productos, categorias] = await Promise.all([
    listarProductosAdmin({ incluirOcultos: true }),
    listarCategoriasAdmin(),
  ]);
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(inventarioCsv(productos, categorias), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventario-peache-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
