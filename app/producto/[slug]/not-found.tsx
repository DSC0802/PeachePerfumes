import type { Metadata } from "next";
import Boton from "@/components/ui/Boton";
import EstadoVacio from "@/components/ui/EstadoVacio";

export const metadata: Metadata = {
  title: "Perfume no encontrado",
};

/**
 * 404 de PRODUCTO (estados §1 «404 de recurso» + §4.3 + checklist §6:
 * «404 de producto ≠ 404 de ruta»): microcopy propio, distinto del 404
 * genérico de ruta que vive en `app/not-found.tsx`. Se activa con
 * `notFound()` desde la página de este segmento.
 */
export default function PerfumeNoEncontrado() {
  return (
    <EstadoVacio
      nivelTitulo="h1"
      titulo="No encontramos este perfume."
      apoyo="Puede que se haya retirado o que el enlace no sea correcto."
    >
      <Boton variante="secundario" href="/catalogo">
        Ver el catálogo
      </Boton>
    </EstadoVacio>
  );
}
