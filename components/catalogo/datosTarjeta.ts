import type { Producto } from "@/lib/catalogo";
import { nombreFamilia } from "@/components/landing/familias";
import type { DatosTarjeta } from "./TarjetaProducto";

/** `Producto` del repositorio → datos del talón (portada, catálogo y relacionados). */
export function aDatosTarjeta(producto: Producto): DatosTarjeta {
  return {
    slug: producto.slug,
    nombre: producto.nombre,
    marca: producto.marca,
    meta: `${nombreFamilia(producto.familia)} · ${producto.tamano}`,
    precio: producto.precio,
    moneda: producto.moneda,
    novedad: producto.novedad,
    agotado: !producto.disponible,
    imagen: producto.imagen,
  };
}
