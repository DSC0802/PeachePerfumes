"use client";

import { useEffect, useRef, useState } from "react";
import type { Producto } from "@/lib/catalogo";
import { useCarrito } from "@/components/carrito/CarritoContexto";
import Boton from "@/components/ui/Boton";
import styles from "./BotonAnadir.module.css";

/**
 * «Añadir al carrito» de las páginas de la revista. Un producto agotado no
 * se puede añadir: el botón lo dice en vez de desaparecer.
 */
export default function BotonAnadir({
  producto,
  className,
}: {
  producto: Producto;
  className?: string;
}) {
  const { agregarProducto } = useCarrito();
  const [aviso, setAviso] = useState("");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  const anadir = () => {
    agregarProducto(producto);
    setAviso(`${producto.nombre} añadido al carrito`);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(""), 3000);
  };

  return (
    <div className={[styles.accion, className].filter(Boolean).join(" ")}>
      <Boton variante="primario" tamano="lg" onClick={anadir} disabled={!producto.disponible}>
        {producto.disponible ? "Añadir al carrito" : "Agotado"}
      </Boton>
      <p className={styles.aviso} role="status" aria-live="polite">
        {aviso}
      </p>
    </div>
  );
}
