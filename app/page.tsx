import type { Metadata } from "next";
import { catalogo, type Producto } from "@/lib/catalogo";
import type { DatosTarjeta } from "@/components/catalogo/TarjetaProducto";
import BloqueEditorial from "@/components/landing/BloqueEditorial";
import Hero from "@/components/landing/Hero";
import Portada from "@/components/landing/Portada";
import SeccionDestacados from "@/components/landing/SeccionDestacados";
import SeccionExplorar from "@/components/landing/SeccionExplorar";
import { nombreFamilia } from "@/components/landing/familias";

/**
 * Portada (estados §3.1): hero (único `h1`) → destacados → novedades →
 * navegación a familias/categorías → bloque editorial. Sólo Server Components
 * y datos desde `@/lib/catalogo` (frontera de abstracción, arquitectura §6).
 * El aviso de datos de demostración vive en `app/layout.tsx` (R3, todo el
 * sitio: una sola copia, sin duplicar).
 */

/** Presupuesto de la portada: destacados 4–8 tarjetas (estados §3.1). */
const LIMITE_DESTACADOS = 8;
const LIMITE_NOVEDADES = 4;

// El título lo aporta el layout (`Peache Perfumes` + template); aquí la
// descripción de la portada. Sin URL de producción hasta la decisión D4.
export const metadata: Metadata = {
  description:
    "Peache Perfumes: selección corta de perfumes contada por sus notas de salida, corazón y fondo. Tienda de demostración.",
};

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

export default async function PaginaInicio() {
  const [destacados, novedades, categorias] = await Promise.all([
    catalogo.listarProductos({ orden: "destacados" }),
    catalogo.listarProductos({ orden: "novedades" }),
    catalogo.listarCategorias(),
  ]);

  return (
    <Portada>
      <Hero
        titulo="Elige por notas, no por etiquetas"
        entradilla="Una selección corta de perfumes, contada por sus notas de salida, de corazón y de fondo, para elegir sin prisa."
        cta={{ etiqueta: "Ver el catálogo", href: "/catalogo" }}
      />

      <SeccionDestacados
        idTitulo="destacados"
        productos={destacados.slice(0, LIMITE_DESTACADOS).map(aTarjeta)}
      />

      <SeccionDestacados
        idTitulo="novedades"
        titulo="Novedades"
        productos={novedades.slice(0, LIMITE_NOVEDADES).map(aTarjeta)}
      />

      <SeccionExplorar categorias={categorias} />

      <BloqueEditorial
        titulo="Un perfume se descubre por capas"
        enlace={{ etiqueta: "Ver todo", href: "/catalogo" }}
      >
        <p>
          Un perfume no huele igual a los cinco minutos que al final del día: la
          salida abre, el corazón se asienta y el fondo permanece. Esa secuencia es
          la pirámide olfativa.
        </p>
        <p>
          Cada ficha la describe con palabras —bergamota, cedro, vainilla— para que
          sepas qué vas a oler, no sólo cómo se ve el frasco.
        </p>
      </BloqueEditorial>
    </Portada>
  );
}
