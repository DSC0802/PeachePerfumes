import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogo } from "@/lib/catalogo";
import Contenedor from "@/components/ui/Contenedor";
import FichaProducto from "@/components/producto/FichaProducto";
import ProductosRelacionados from "@/components/producto/ProductosRelacionados";
import VolverCatalogo from "@/components/producto/VolverCatalogo";

/**
 * `/producto/[slug]` (estados §3.2): Server Component + `generateStaticParams`.
 * Datos SÓLO desde `@/lib/catalogo` (checklist §6.4): sin `@/data/*`, sin
 * `fetch`, sin `app/api/`. Slug desconocido → `notFound()` → 404 específico
 * de producto (`./not-found.tsx`), nunca el 404 genérico de ruta (§1 y §4.3).
 */

/** Presupuesto de relacionados: la rejilla son 4 columnas ≥1024px (§8). */
const LIMITE_RELACIONADOS = 4;

/**
 * Desde F3-C el catálogo cambia en tiempo de ejecución (el admin crea
 * productos desde el panel): cualquier slug se resuelve en cada petición y
 * `notFound()` responde por los que no existen, están ocultos o
 * descontinuados. `generateStaticParams` sólo precalienta los existentes.
 * (Antes `dynamicParams = false` rechazaba en `next dev` todo producto creado
 * después de compilar.)
 */
export async function generateStaticParams() {
  const productos = await catalogo.listarProductos();
  return productos.map((producto) => ({ slug: producto.slug }));
}

/** Título con marca y nombre (template del layout añade «· Peache Perfumes»). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const producto = await catalogo.obtenerProductoPorSlug(slug);
  if (!producto) notFound();

  return {
    title: `${producto.marca} ${producto.nombre}`,
    description: producto.descripcion,
  };
}

export default async function PaginaFichaProducto({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const producto = await catalogo.obtenerProductoPorSlug(slug);
  if (!producto) notFound();

  const [relacionados, categorias] = await Promise.all([
    catalogo.listarRelacionados(slug, LIMITE_RELACIONADOS),
    catalogo.listarCategorias(),
  ]);
  const categoria =
    categorias.find((entrada) => entrada.id === producto.categoriaId) ?? null;

  return (
    <Contenedor ancho="ancho">
      <FichaProducto producto={producto} categoria={categoria} />
      <ProductosRelacionados productos={relacionados} />
      <VolverCatalogo />
    </Contenedor>
  );
}
