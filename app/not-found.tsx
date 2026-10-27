import type { Metadata } from "next";
import Boton from "@/components/ui/Boton";
import EstadoVacio from "@/components/ui/EstadoVacio";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

/**
 * 404 de ruta — microcopy literal de estados-y-responsividad.md §4.3
 * ("Esta página no existe." / "Comprueba la dirección o vuelve al inicio." /
 * "Ir al inicio"), más el enlace al catálogo.
 */
export default function NoEncontrado() {
  return (
    <EstadoVacio
      nivelTitulo="h1"
      titulo="Esta página no existe."
      apoyo="Comprueba la dirección o vuelve al inicio."
    >
      <Boton variante="secundario" href="/">
        Ir al inicio
      </Boton>
      <Boton variante="terciario" href="/catalogo">
        Ver el catálogo
      </Boton>
    </EstadoVacio>
  );
}
