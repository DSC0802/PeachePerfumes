import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import styles from "@/components/pedidos/Pedido.module.css";
import VaciarCarritoAlCrear from "@/components/pedidos/VaciarCarritoAlCrear";
import Boton from "@/components/ui/Boton";
import Contenedor from "@/components/ui/Contenedor";
import Etiqueta from "@/components/ui/Etiqueta";
import Precio from "@/components/ui/Precio";
import { obtenerWhatsappTienda } from "@/lib/ajustes/repositorio";
import { obtenerSesionActual } from "@/lib/auth/acceso";
import { obtenerTasaVigente } from "@/lib/moneda/repositorio";
import { EXPLICACION_ESTADO, NOMBRE_ESTADO_PEDIDO } from "@/lib/pedidos/estados";
import { obtenerPedidoDeUsuario } from "@/lib/pedidos/repositorio";
import { enlaceWhatsApp, formatearNumeroPedido, textoVale } from "@/lib/pedidos/whatsapp";

export const metadata: Metadata = {
  title: "Tu pedido",
};

const fecha = new Intl.DateTimeFormat("es-CU", { dateStyle: "medium", timeStyle: "short" });

/** /pedidos/[numero] — confirmación (HU-34) y seguimiento (HU-38). Sólo el dueño. */
export default async function PaginaPedidoCliente({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const [{ numero }, { nuevo }] = await Promise.all([params, searchParams]);
  const usuario = await obtenerSesionActual();
  if (!usuario) redirect(`/login?next=/pedidos/${encodeURIComponent(numero)}`);

  const pedido = await obtenerPedidoDeUsuario(Number(numero), usuario.id);
  if (!pedido) notFound();

  const [whatsapp, tasa, cabeceras] = await Promise.all([obtenerWhatsappTienda(), obtenerTasaVigente(), headers()]);
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "localhost:3000";
  const protocolo = cabeceras.get("x-forwarded-proto") ?? "http";
  const enlace = whatsapp
    ? enlaceWhatsApp(
        whatsapp,
        textoVale({
          numeroPedido: pedido.numero,
          cliente: usuario.nombre ?? usuario.email,
          lineas: pedido.lineas,
          totalUsd: pedido.totalUsd,
          tasa: tasa?.cupPorUsd ?? null,
          urlPedido: `${protocolo}://${host}/pedidos/${pedido.numero}`,
        }),
      )
    : null;
  const recienCreado = nuevo === "1";
  const activo = pedido.estado !== "cancelado" && pedido.estado !== "entregado";

  return (
    <Contenedor ancho="estrecho" seccion>
      {recienCreado ? <VaciarCarritoAlCrear /> : null}
      <p className={styles.volver}>
        <Link href="/pedidos">← Mis pedidos</Link>
      </p>
      <h1>Pedido {formatearNumeroPedido(pedido.numero)}</h1>

      <div className={styles.secciones}>
        {recienCreado ? (
          <section className={styles.recibido} aria-labelledby="pedido-recibido">
            <h2 id="pedido-recibido" className={styles.subtitulo}>Pedido recibido. Último paso:</h2>
            <p>Envíanos el vale por WhatsApp para acordar la entrega. El mensaje ya va escrito; sólo pulsa Enviar.</p>
            {enlace ? (
              <Boton href={enlace} tamano="lg" className={styles.whatsapp}>
                Enviar el vale por WhatsApp
              </Boton>
            ) : null}
          </section>
        ) : null}

        <section className={styles.estado} aria-labelledby="pedido-estado">
          <h2 id="pedido-estado" className={styles.subtitulo}>
            Estado: <Etiqueta variante={pedido.estado === "cancelado" ? "neutral" : "info"}>{NOMBRE_ESTADO_PEDIDO[pedido.estado]}</Etiqueta>
          </h2>
          <p>{EXPLICACION_ESTADO[pedido.estado]}</p>
        </section>

        <div className={styles.vale}>
          <header className={styles.valeCabecera}>
            <p className={styles.valeTipo}>Vale de pedido</p>
            <p className="cifras">{formatearNumeroPedido(pedido.numero)}</p>
          </header>
          <ul className={styles.lineas}>
            {pedido.lineas.map((linea) => (
              <li key={linea.slug} className={styles.linea}>
                <span className={`${styles.cantidad} cifras`}>{linea.cantidad} ×</span>
                <span className={styles.nombreLinea}>
                  {linea.enCatalogo ? <Link href={`/producto/${linea.slug}`}>{linea.nombre}</Link> : linea.nombre}
                  <span className={styles.secundario}>
                    {linea.marca} · {linea.tamano}
                  </span>
                </span>
                <span className={styles.importeLinea}>
                  <Precio valor={linea.precioUsd * linea.cantidad} variante="tarjeta" />
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.total}>
            <span>Total</span>
            <Precio valor={pedido.totalUsd} variante="ficha" className={styles.totalCifra} />
          </div>
          <p className={styles.nota}>
            Pagas en efectivo al recibirlo. Precios guardados en USD; el equivalente en CUP es al cambio de hoy.
          </p>
          {!recienCreado && enlace && activo ? (
            <Boton href={enlace} variante="secundario" className={styles.whatsapp}>
              Enviar el vale por WhatsApp
            </Boton>
          ) : null}
        </div>

        <section aria-labelledby="pedido-historial">
          <h2 id="pedido-historial" className={styles.subtitulo}>Seguimiento</h2>
          <ol className={styles.historial}>
            {pedido.historial.map((paso, i) => (
              <li key={`${paso.estado}-${i}`} className={styles.paso}>
                <span>{NOMBRE_ESTADO_PEDIDO[paso.estado]}</span>
                <time dateTime={paso.creadoEn.toISOString()}>{fecha.format(paso.creadoEn)}</time>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Contenedor>
  );
}
