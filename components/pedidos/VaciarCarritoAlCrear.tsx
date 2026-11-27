"use client";

import { useEffect } from "react";
import { useCarrito } from "@/components/carrito/CarritoContexto";

/** Tras crear el pedido (?nuevo=1) el carrito se vacía una vez (spec F3-D §2.4). */
export default function VaciarCarritoAlCrear() {
  const { limpiarCarrito } = useCarrito();
  useEffect(() => {
    limpiarCarrito();
    // Sólo al montar: el pedido ya está creado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
