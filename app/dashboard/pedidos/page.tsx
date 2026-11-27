import type { Metadata } from "next";
import Link from "next/link";
import tabla from "@/components/admin/TablaProductos.module.css";
import panel from "@/components/dashboard/Panel.module.css";
import Boton from "@/components/ui/Boton";
import Etiqueta from "@/components/ui/Etiqueta";
import Precio from "@/components/ui/Precio";
import { ESTADOS_PEDIDO, esEstadoPedido, NOMBRE_ESTADO_PEDIDO } from "@/lib/pedidos/estados";
import { listarPedidos } from "@/lib/pedidos/repositorio";
import { formatearNumeroPedido } from "@/lib/pedidos/whatsapp";

export const metadata: Metadata = {
  title: "Pedidos · Panel",
};

const fecha = new Intl.DateTimeFormat("es-CU", { dateStyle: "medium", timeStyle: "short" });

function leerFecha(valor: string | undefined, finDeDia = false): Date | undefined {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return undefined;
  const d = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  if (finDeDia) d.setDate(d.getDate() + 1);
  return d;
}

/** /dashboard/pedidos — HU-35: todos los pedidos con filtros por URL. */
export default async function PaginaPedidosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; desde?: string; hasta?: string; q?: string }>;
}) {
  const p = await searchParams;
  const estado = esEstadoPedido(p.estado) ? p.estado : undefined;
  const q = p.q?.trim() ?? "";
  const pedidos = await listarPedidos({
    estado,
    q,
    desde: leerFecha(p.desde),
    hasta: leerFecha(p.hasta, true),
  });
  const hayFiltros = Boolean(estado || q || p.desde || p.hasta);

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <h1>Pedidos</h1>
          <p className={panel.subtitulo}>
            {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
            {hayFiltros ? " con estos filtros" : ""}. Importes en USD.
          </p>
        </div>
      </header>

      <form className={tabla.filtros} method="get" role="search" aria-label="Filtrar pedidos">
        <div className={tabla.campo}>
          <label htmlFor="filtro-q">Buscar</label>
          <input id="filtro-q" name="q" type="search" defaultValue={q} placeholder="Cliente o número" />
        </div>
        <div className={tabla.campo}>
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" name="estado" defaultValue={estado ?? ""}>
            <option value="">Todos</option>
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO_PEDIDO[e]}
              </option>
            ))}
          </select>
        </div>
        <div className={tabla.campo}>
          <label htmlFor="filtro-desde">Desde</label>
          <input id="filtro-desde" name="desde" type="date" defaultValue={p.desde ?? ""} />
        </div>
        <div className={tabla.campo}>
          <label htmlFor="filtro-hasta">Hasta</label>
          <input id="filtro-hasta" name="hasta" type="date" defaultValue={p.hasta ?? ""} />
        </div>
        <div className={tabla.acciones}>
          <Boton type="submit" variante="secundario">
            Filtrar
          </Boton>
          {hayFiltros ? <Link href="/dashboard/pedidos">Quitar filtros</Link> : null}
        </div>
      </form>

      <section className={panel.tarjeta} aria-label="Listado de pedidos">
        {pedidos.length === 0 ? (
          <p className={panel.vacio}>
            {hayFiltros ? "Ningún pedido coincide con estos filtros." : "Todavía no hay pedidos."}
          </p>
        ) : (
          <div className={panel.tablaContenedor}>
            <table className={panel.tabla}>
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Cliente</th>
                  <th scope="col" className={panel.num}>
                    Artículos
                  </th>
                  <th scope="col" className={panel.num}>
                    Total
                  </th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.numero}>
                    <th scope="row">
                      <Link href={`/dashboard/pedidos/${pedido.numero}`} className="cifras">
                        {formatearNumeroPedido(pedido.numero)}
                      </Link>
                      <span className={panel.secundario}>
                        <time dateTime={pedido.creadoEn.toISOString()}>{fecha.format(pedido.creadoEn)}</time>
                      </span>
                    </th>
                    <td>
                      {pedido.cliente.nombre ?? "Sin nombre"}
                      <span className={panel.secundario}>{pedido.cliente.email}</span>
                    </td>
                    <td className={panel.num}>{pedido.articulos}</td>
                    <td className={panel.num}>
                      <Precio valor={pedido.totalUsd} variante="nota" />
                    </td>
                    <td>
                      <Etiqueta variante={pedido.estado === "cancelado" ? "neutral" : "info"}>
                        {NOMBRE_ESTADO_PEDIDO[pedido.estado]}
                      </Etiqueta>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
