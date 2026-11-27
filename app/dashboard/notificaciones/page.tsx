import type { Metadata } from "next";
import Link from "next/link";
import tabla from "@/components/admin/TablaProductos.module.css";
import panel from "@/components/dashboard/Panel.module.css";
import Boton from "@/components/ui/Boton";
import Precio from "@/components/ui/Precio";
import { marcarNotificacionAccion, marcarTodasLeidasAccion } from "@/lib/pedidos/acciones";
import { listarNotificaciones } from "@/lib/pedidos/repositorio";
import { formatearNumeroPedido } from "@/lib/pedidos/whatsapp";

export const metadata: Metadata = {
  title: "Notificaciones · Panel",
};

const fecha = new Intl.DateTimeFormat("es-CU", { dateStyle: "medium", timeStyle: "short" });

/** /dashboard/notificaciones — HU-40/41: un aviso por pedido nuevo, leída / no leída. */
export default async function PaginaNotificaciones() {
  const avisos = await listarNotificaciones();
  const sinLeer = avisos.filter((a) => !a.leida).length;

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <h1>Notificaciones</h1>
          <p className={panel.subtitulo}>
            {sinLeer === 0 ? "Todo leído." : `${sinLeer} sin leer.`}
          </p>
        </div>
        {sinLeer > 0 ? (
          <form action={marcarTodasLeidasAccion}>
            <Boton type="submit" variante="secundario">
              Marcar todas como leídas
            </Boton>
          </form>
        ) : null}
      </header>

      <section className={panel.tarjeta} aria-label="Avisos">
        {avisos.length === 0 ? (
          <p className={panel.vacio}>Todavía no hay avisos. Cada pedido nuevo aparecerá aquí.</p>
        ) : (
          <ul className={panel.avisos}>
            {avisos.map((a) => (
              <li key={a.id} className={panel.avisoFila}>
                <span>
                  {a.leida ? null : <span className="solo-lectura">Sin leer: </span>}
                  <strong style={{ fontWeight: a.leida ? 400 : 700 }}>
                    Pedido nuevo{" "}
                    {a.numeroPedido !== null ? (
                      <Link href={`/dashboard/pedidos/${a.numeroPedido}`} className="cifras">
                        {formatearNumeroPedido(a.numeroPedido)}
                      </Link>
                    ) : null}
                  </strong>
                  <span className={panel.secundario}>
                    {a.cliente ?? "Cliente"} · <time dateTime={a.creadaEn.toISOString()}>{fecha.format(a.creadaEn)}</time>
                  </span>
                </span>
                {a.totalUsd !== null ? <Precio valor={a.totalUsd} variante="nota" /> : <span />}
                <form action={marcarNotificacionAccion}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="leida" value={a.leida ? "0" : "1"} />
                  <button type="submit" className={tabla.botonTexto}>
                    {a.leida ? "Marcar como no leída" : "Marcar como leída"}
                    <span className="solo-lectura">
                      {" "}
                      (pedido {a.numeroPedido !== null ? formatearNumeroPedido(a.numeroPedido) : ""})
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
