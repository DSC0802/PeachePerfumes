import type { Metadata } from "next";
import Contenedor from "@/components/ui/Contenedor";
import Carrito from "@/components/carrito/Carrito";

/**
 * `/carrito` (Fase 2, demo): consume el carrito de estado local a través del
 * componente cliente `Carrito`. Sin backend, sin pagos reales.
 */
export const metadata: Metadata = {
  title: "Carrito",
  description: "Tu carrito de compras de Peache Perfumes. Datos de demostración.",
};

export default function PaginaCarrito() {
  return (
    <Contenedor>
      <h1>Tu carrito</h1>
      <Carrito />
    </Contenedor>
  );
}
