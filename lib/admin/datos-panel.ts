/**
 * Carga común de las vistas del panel (F3-C). Sólo servidor.
 */
import { calcularResumen, type ResumenPanel } from "./metricas";
import { listarCategoriasAdmin, listarClientes, listarProductosAdmin } from "./repositorio-admin";

export async function cargarResumen(): Promise<ResumenPanel> {
  const [productos, categorias, clientes] = await Promise.all([
    listarProductosAdmin({ incluirOcultos: true }),
    listarCategoriasAdmin(),
    listarClientes(),
  ]);
  return calcularResumen(productos, categorias, clientes);
}

/** El CRUD escribe en Postgres; con la fuente demo la tienda no lo refleja. */
export function tiendaUsaDemo(): boolean {
  return process.env.FUENTE_CATALOGO !== "postgres";
}
