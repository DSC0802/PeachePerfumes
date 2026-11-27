import type { Metadata } from "next";
import FormularioTasa from "@/components/admin/FormularioTasa";
import FormularioWhatsapp from "@/components/admin/FormularioWhatsapp";
import { obtenerWhatsappTienda } from "@/lib/ajustes/repositorio";
import panel from "@/components/dashboard/Panel.module.css";
import { listarProductosAdmin } from "@/lib/admin/repositorio-admin";
import { formatearNumero } from "@/lib/moneda/formato";
import { historialTasas, obtenerTasaVigente } from "@/lib/moneda/repositorio";

export const metadata: Metadata = {
  title: "Ajustes · Panel",
};

const fecha = new Intl.DateTimeFormat("es-CU", { dateStyle: "medium", timeStyle: "short" });
const numero = { format: (v: number) => formatearNumero(v, Number.isInteger(v) ? 0 : 2) };

/** /dashboard/ajustes — WhatsApp de la tienda (F3-D) y tasa «CUP por 1 USD» (F3-C2, HU-52). */
export default async function PaginaAjustes() {
  const [vigente, historial, productos, whatsapp] = await Promise.all([
    obtenerTasaVigente(),
    historialTasas(10),
    listarProductosAdmin(),
    obtenerWhatsappTienda(),
  ]);
  const muestras = productos.slice(0, 3).map((p) => ({ nombre: p.nombre, precioUsd: p.precioUsd }));

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <h1>Ajustes</h1>
          <p className={panel.subtitulo}>
            {vigente
              ? `Tasa vigente: 1 USD = ${numero.format(vigente.cupPorUsd)} CUP, desde el ${fecha.format(vigente.creadaEn).replace(/\.$/, "")}.`
              : "Todavía no hay tasa: la tienda sólo muestra precios en USD."}
          </p>
        </div>
      </header>

      {whatsapp ? null : (
        <p className={panel.aviso} role="note">
          Sin número de WhatsApp la tienda no deja confirmar pedidos. Escríbelo abajo.
        </p>
      )}

      <section className={`${panel.tarjeta} ${panel.seccion}`} aria-labelledby="titulo-whatsapp">
        <div className={panel.tarjeta__cabecera}>
          <h2 id="titulo-whatsapp" className={panel.tarjeta__titulo}>
            Pedidos por WhatsApp
          </h2>
          <p className={panel.tarjeta__nota}>El cliente te envía el vale desde su propio WhatsApp.</p>
        </div>
        <FormularioWhatsapp actual={whatsapp} />
      </section>

      <section className={`${panel.tarjeta} ${panel.seccion}`} aria-labelledby="titulo-tasa">
        <div className={panel.tarjeta__cabecera}>
          <h2 id="titulo-tasa" className={panel.tarjeta__titulo}>
            Fijar la tasa
          </h2>
          <p className={panel.tarjeta__nota}>Los precios se guardan en USD; el CUP se calcula al vuelo y se redondea al peso.</p>
        </div>
        <FormularioTasa tasaActual={vigente?.cupPorUsd ?? null} muestras={muestras} />
      </section>

      <section className={`${panel.tarjeta} ${panel.seccion}`} aria-labelledby="titulo-historial">
        <div className={panel.tarjeta__cabecera}>
          <h2 id="titulo-historial" className={panel.tarjeta__titulo}>
            Historial
          </h2>
          <p className={panel.tarjeta__nota}>Últimos 10 cambios</p>
        </div>
        {historial.length === 0 ? (
          <p className={panel.vacio}>Aún no se ha fijado ninguna tasa.</p>
        ) : (
          <div className={panel.tablaContenedor} tabIndex={0} role="region" aria-labelledby="titulo-historial">
            <table className={panel.tabla}>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col" className={panel.num}>
                    CUP por 1 USD
                  </th>
                  <th scope="col">Fijada por</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((t, i) => (
                  <tr key={t.id}>
                    <th scope="row">
                      <time dateTime={t.creadaEn.toISOString()}>{fecha.format(t.creadaEn)}</time>
                      {i === 0 ? <span className={panel.secundario}>Vigente</span> : null}
                    </th>
                    <td className={`${panel.num} cifras`}>{numero.format(t.cupPorUsd)}</td>
                    <td>{t.autor ?? "Cuenta eliminada"}</td>
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
