import type { Metadata } from "next";
import Contenedor from "@/components/ui/Contenedor";
import Carrito from "@/components/carrito/Carrito";

/**
 * `/carrito`: consume el carrito de estado local a través del
 * componente cliente `Carrito`.
 */
export const metadata: Metadata = {
  title: "Carrito",
  description: "Tu carrito de compras de Peache Perfumes.",
};

export default function PaginaCarrito() {
  return (
    <Contenedor seccion>
      <h1>Tu carrito</h1>
      <Carrito />
    </Contenedor>
  );
}
