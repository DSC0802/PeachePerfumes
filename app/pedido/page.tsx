import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RevisionPedido from "@/components/pedidos/RevisionPedido";
import Contenedor from "@/components/ui/Contenedor";
import { obtenerSesionActual } from "@/lib/auth/acceso";

export const metadata: Metadata = {
  title: "Confirmar pedido",
};

/** /pedido — revisión y confirmación (F3-D, HU-30/31/32). Exige sesión. */
export default async function PaginaPedido() {
  const usuario = await obtenerSesionActual();
  if (!usuario) redirect("/login?next=/pedido");

  return (
    <Contenedor ancho="estrecho" seccion>
      <h1>Confirmar pedido</h1>
      <RevisionPedido />
    </Contenedor>
  );
}
