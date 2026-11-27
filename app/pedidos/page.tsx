import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "@/components/pedidos/Pedido.module.css";
import Boton from "@/components/ui/Boton";
import Contenedor from "@/components/ui/Contenedor";
import EstadoVacio from "@/components/ui/EstadoVacio";
import Etiqueta from "@/components/ui/Etiqueta";
import Precio from "@/components/ui/Precio";
import { obtenerSesionActual } from "@/lib/auth/acceso";
import { NOMBRE_ESTADO_PEDIDO } from "@/lib/pedidos/estados";
import { listarPedidos } from "@/lib/pedidos/repositorio";
import { formatearNumeroPedido } from "@/lib/pedidos/whatsapp";

export const metadata: Metadata = {
  title: "Mis pedidos",
};

const fecha = new Intl.DateTimeFormat("es-CU", { dateStyle: "medium" });

/** /pedidos — «Mis pedidos» (F3-D, HU-38). Sólo los propios. */
export default async function PaginaMisPedidos() {
  const usuario = await obtenerSesionActual();
  if (!usuario) redirect("/login?next=/pedidos");
  const pedidos = await listarPedidos({ usuarioId: usuario.id });

  return (
    <Contenedor ancho="estrecho" seccion>
      <h1>Mis pedidos</h1>
      {pedidos.length === 0 ? (
        <EstadoVacio titulo="Todavía no has hecho ningún pedido" apoyo="Cuando confirmes uno, aquí verás su estado." nivelTitulo="h2">
          <Boton variante="secundario" href="/catalogo">
            Ver el catálogo
          </Boton>
        </EstadoVacio>
      ) : (
        <ul className={styles.lista}>
          {pedidos.map((p) => (
            <li key={p.numero}>
              <Link href={`/pedidos/${p.numero}`} className={styles.filaPedido}>
                <span className={`${styles.numero} cifras`}>{formatearNumeroPedido(p.numero)}</span>
                <span>
                  <time dateTime={p.creadoEn.toISOString()}>{fecha.format(p.creadoEn)}</time>
                  <span className={styles.secundario}>
                    {" · "}
                    {p.articulos} {p.articulos === 1 ? "artículo" : "artículos"}
                  </span>
                  <br />
                  <Etiqueta variante={p.estado === "cancelado" ? "neutral" : "info"}>{NOMBRE_ESTADO_PEDIDO[p.estado]}</Etiqueta>
                </span>
                <Precio valor={p.totalUsd} variante="tarjeta" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Contenedor>
  );
}
