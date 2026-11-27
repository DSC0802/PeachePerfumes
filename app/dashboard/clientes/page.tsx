import type { Metadata } from "next";
import panel from "@/components/dashboard/Panel.module.css";
import Etiqueta from "@/components/ui/Etiqueta";
import { listarClientes } from "@/lib/admin/repositorio-admin";

export const metadata: Metadata = {
  title: "Clientes · Panel",
};

const fecha = new Intl.DateTimeFormat("es-CU", { dateStyle: "medium", timeZone: "UTC" });

/** /dashboard/clientes — cuentas registradas (sólo lectura; nunca el hash). */
export default async function PaginaClientes() {
  const cuentas = await listarClientes();
  const clientes = cuentas.filter((c) => c.rol === "cliente").length;
  const admins = cuentas.length - clientes;

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <h1>Clientes</h1>
          <p className={panel.subtitulo}>
            {clientes} {clientes === 1 ? "cliente registrado" : "clientes registrados"} · {admins}{" "}
            {admins === 1 ? "administrador" : "administradores"}
          </p>
        </div>
      </header>

      <section className={panel.tarjeta} aria-label="Cuentas registradas">
        {cuentas.length === 0 ? (
          <p className={panel.vacio}>Todavía no hay cuentas.</p>
        ) : (
          <div className={panel.tablaContenedor} tabIndex={0} role="region" aria-label="Tabla de cuentas">
            <table className={panel.tabla}>
              <thead>
                <tr>
                  <th scope="col">Cuenta</th>
                  <th scope="col">Teléfono / WhatsApp</th>
                  <th scope="col">Rol</th>
                  <th scope="col" className={panel.num}>
                    Alta
                  </th>
                </tr>
              </thead>
              <tbody>
                {cuentas.map((c) => (
                  <tr key={c.id}>
                    <th scope="row">
                      {c.nombre ?? "Sin nombre"}
                      <span className={panel.secundario}>{c.email}</span>
                    </th>
                    <td>{c.telefono ?? "—"}</td>
                    <td>
                      <Etiqueta variante={c.rol === "admin" ? "info" : "neutral"}>
                        {c.rol === "admin" ? "Admin" : "Cliente"}
                      </Etiqueta>
                    </td>
                    <td className={panel.num}>
                      <time dateTime={c.creadoEn.toISOString()}>{fecha.format(c.creadoEn)}</time>
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
