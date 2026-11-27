import type { Producto } from "@/lib/catalogo";
import RejillaCatalogo from "@/components/catalogo/RejillaCatalogo";
import TarjetaProducto from "@/components/catalogo/TarjetaProducto";
import { aDatosTarjeta } from "@/components/catalogo/datosTarjeta";
import styles from "./ProductosRelacionados.module.css";

/**
 * §3.2 — relacionados de la ficha: `catalogo.listarRelacionados` (misma
 * categoría, excluye el actual) pintados con `TarjetaProducto` dentro de
 * `RejillaCatalogo` (§7 + §8). `h2` de sección + `h3` por tarjeta: jerarquía
 * sin saltos (arquitectura §8). Si la sección viene vacía, no se renderiza.
 */


export default function ProductosRelacionados({
  productos,
}: {
  productos: Producto[];
}) {
  if (productos.length === 0) return null;

  return (
    <section
      className={styles.relacionados}
      aria-labelledby="ficha-relacionados"
    >
      <h2 id="ficha-relacionados" className={styles.titulo}>
        También te puede gustar
      </h2>
      <RejillaCatalogo>
        {productos.map((producto) => (
          <TarjetaProducto key={producto.id} producto={aDatosTarjeta(producto)} />
        ))}
      </RejillaCatalogo>
    </section>
  );
}
