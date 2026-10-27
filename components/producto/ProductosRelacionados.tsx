import type { Producto } from "@/lib/catalogo";
import { nombreFamilia } from "@/components/landing/familias";
import RejillaCatalogo from "@/components/catalogo/RejillaCatalogo";
import TarjetaProducto from "@/components/catalogo/TarjetaProducto";
import type { DatosTarjeta } from "@/components/catalogo/TarjetaProducto";
import styles from "./ProductosRelacionados.module.css";

/**
 * §3.2 — relacionados de la ficha: `catalogo.listarRelacionados` (misma
 * categoría, excluye el actual) pintados con `TarjetaProducto` dentro de
 * `RejillaCatalogo` (§7 + §8). `h2` de sección + `h3` por tarjeta: jerarquía
 * sin saltos (arquitectura §8). Si la sección viene vacía, no se renderiza.
 */

/** `Producto` del repositorio → datos de la tarjeta (§7), meta «familia · envase». */
function aTarjeta(producto: Producto): DatosTarjeta {
  return {
    slug: producto.slug,
    nombre: producto.nombre,
    meta: `${nombreFamilia(producto.familia)} · ${producto.tamano}`,
    precio: producto.precio,
    moneda: producto.moneda,
    novedad: producto.novedad,
    imagen: producto.imagen,
  };
}

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
        Productos relacionados
      </h2>
      <RejillaCatalogo>
        {productos.map((producto) => (
          <TarjetaProducto key={producto.id} producto={aTarjeta(producto)} />
        ))}
      </RejillaCatalogo>
    </section>
  );
}
