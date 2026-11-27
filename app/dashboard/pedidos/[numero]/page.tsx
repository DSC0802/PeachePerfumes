import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormularioConfirmado from "@/components/admin/FormularioConfirmado";
import panel from "@/components/dashboard/Panel.module.css";
import Boton from "@/components/ui/Boton";
import Etiqueta from "@/components/ui/Etiqueta";
import Precio from "@/components/ui/Precio";
import { cambiarEstadoPedidoAccion } from "@/lib/pedidos/acciones";
import { NOMBRE_ESTADO_PEDIDO, transicionesValidas } from "@/lib/pedidos/estados";
import { obtenerPedidoAdmin } from "@/lib/pedidos/repositorio";
import { formatearNumeroPedido } from "@/lib/pedidos/whatsapp";

export const metadata: Metadata = {
  title: "Pedido · Panel",
};

const fecha = new Intl.DateTimeFormat("es-CU", { dateStyle: "medium", timeStyle: "short" });

const AVISOS: Record<string, string> = {
  transicion_invalida: "Ese cambio de estado ya no es posible (alguien lo cambió antes). Revisa el estado actual.",
  no_encontrado: "No encontramos el pedido.",
};

/** /dashboard/pedidos/[numero] — HU-36/37: detalle, historial y cambio de estado. */
export default async function PaginaPedidoAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const [{ numero }, { aviso }] = await Promise.all([params, searchParams]);
  const pedido = await obtenerPedidoAdmin(Number(numero));
  if (!pedido) notFound();

  const siguientes = transicionesValidas(pedido.estado);
  const [avance, ...saltos] = siguientes.filter((e) => e !== "cancelado");
  const volver = `/dashboard/pedidos/${pedido.numero}`;

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <p className={panel.subtitulo}>
            <Link href="/dashboard/pedidos">← Pedidos</Link>
          </p>
          <h1>
            Pedido <span className="cifras">{formatearNumeroPedido(pedido.numero)}</span>
          </h1>
          <p className={panel.subtitulo}>
            {fecha.format(pedido.creadoEn)} ·{" "}
            <Etiqueta variante={pedido.estado === "cancelado" ? "neutral" : "info"}>
              {NOMBRE_ESTADO_PEDIDO[pedido.estado]}
            </Etiqueta>
          </p>
        </div>
      </header>

      {aviso && AVISOS[aviso] ? (
        <p className={panel.aviso} role="alert">
          {AVISOS[aviso]}
        </p>
      ) : null}

      {siguientes.length > 0 ? (
        <section className={panel.tarjeta} aria-labelledby="titulo-acciones">
          <div className={panel.tarjeta__cabecera}>
            <h2 id="titulo-acciones" className={panel.tarjeta__titulo}>
              Siguiente paso
            </h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "center" }}>
            {avance ? (
              <form action={cambiarEstadoPedidoAccion}>
                <input type="hidden" name="numero" value={pedido.numero} />
                <input type="hidden" name="estado" value={avance} />
                <input type="hidden" name="volver" value={volver} />
                <Boton type="submit">Marcar como «{NOMBRE_ESTADO_PEDIDO[avance]}»</Boton>
              </form>
            ) : null}
            {saltos.length > 0 ? (
              <FormularioConfirmado
                accion={cambiarEstadoPedidoAccion}
                mensaje={`¿Cambiar el estado del pedido ${formatearNumeroPedido(pedido.numero)}? Se saltan los pasos intermedios y no se puede volver atrás.`}
                className={panel.salto}
              >
                <input type="hidden" name="numero" value={pedido.numero} />
                <input type="hidden" name="volver" value={volver} />
                <label htmlFor="salto-estado">Saltar a</label>
                <select id="salto-estado" name="estado" defaultValue={saltos[saltos.length - 1]}>
                  {saltos.map((e) => (
                    <option key={e} value={e}>
                      {NOMBRE_ESTADO_PEDIDO[e]}
                    </option>
                  ))}
                </select>
                <Boton type="submit" variante="secundario">
                  Cambiar estado
                </Boton>
              </FormularioConfirmado>
            ) : null}
            <FormularioConfirmado
              accion={cambiarEstadoPedidoAccion}
              mensaje={`¿Cancelar el pedido ${formatearNumeroPedido(pedido.numero)}? Su stock vuelve al catálogo.`}
            >
              <input type="hidden" name="numero" value={pedido.numero} />
              <input type="hidden" name="estado" value="cancelado" />
              <input type="hidden" name="volver" value={volver} />
              <Boton type="submit" variante="peligro">
                Cancelar pedido
              </Boton>
            </FormularioConfirmado>
          </div>
        </section>
      ) : null}

      <div className={`${panel.rejilla} ${panel["rejilla--2"]}`} style={{ marginTop: "var(--space-5)" }}>
        <section className={panel.tarjeta} aria-labelledby="titulo-lineas">
          <div className={panel.tarjeta__cabecera}>
            <h2 id="titulo-lineas" className={panel.tarjeta__titulo}>
              Productos
            </h2>
            <p className={panel.tarjeta__nota}>precios al pedir (USD)</p>
          </div>
          <div className={panel.tablaContenedor} tabIndex={0} role="region" aria-labelledby="titulo-lineas">
            <table className={panel.tabla}>
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col" className={panel.num}>
                    Cant.
                  </th>
                  <th scope="col" className={panel.num}>
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {pedido.lineas.map((l) => (
                  <tr key={l.slug}>
                    <th scope="row">
                      {l.nombre}
                      <span className={panel.secundario}>
                        {l.marca} · {l.tamano}
                      </span>
                    </th>
                    <td className={panel.num}>{l.cantidad}</td>
                    <td className={panel.num}>
                      <Precio valor={l.precioUsd * l.cantidad} variante="nota" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td className={panel.num}>{pedido.lineas.reduce((s, l) => s + l.cantidad, 0)}</td>
                  <td className={panel.num}>
                    <Precio valor={pedido.totalUsd} variante="nota" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className={panel.rejilla}>
          <section className={panel.tarjeta} aria-labelledby="titulo-cliente">
            <div className={panel.tarjeta__cabecera}>
              <h2 id="titulo-cliente" className={panel.tarjeta__titulo}>
                Cliente
              </h2>
            </div>
            <p style={{ margin: 0 }}>
              {pedido.cliente.nombre ?? "Sin nombre"}
              <span className={panel.secundario}>{pedido.cliente.email}</span>
              {pedido.cliente.telefono ? <span className={panel.secundario}>Tel. {pedido.cliente.telefono}</span> : null}
            </p>
          </section>

          <section className={panel.tarjeta} aria-labelledby="titulo-historial">
            <div className={panel.tarjeta__cabecera}>
              <h2 id="titulo-historial" className={panel.tarjeta__titulo}>
                Historial
              </h2>
            </div>
            <ol className={panel.vacio} style={{ display: "grid", gap: "var(--space-2)", paddingInlineStart: "1.2em" }}>
              {pedido.historial.map((h, i) => (
                <li key={`${h.estado}-${i}`}>
                  <strong>{NOMBRE_ESTADO_PEDIDO[h.estado]}</strong> ·{" "}
                  <time dateTime={h.creadoEn.toISOString()}>{fecha.format(h.creadoEn)}</time>
                  {h.autor ? ` · ${h.autor}` : ""}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
