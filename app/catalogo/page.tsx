import type { Metadata } from "next";
import {
  catalogo,
  type FamiliaOlfativa,
  type OrdenCatalogo,
} from "@/lib/catalogo";
import RejillaCatalogo from "@/components/catalogo/RejillaCatalogo";
import TarjetaProducto from "@/components/catalogo/TarjetaProducto";
import { aDatosTarjeta } from "@/components/catalogo/datosTarjeta";
import VistaCatalogo from "@/components/catalogo/VistaCatalogo";
import { ORDEN_DEFECTO, esOrdenVisible } from "@/components/catalogo/ordenes";
import Contenedor from "@/components/ui/Contenedor";
import { FAMILIAS } from "@/components/landing/familias";

/**
 * `/catalogo` (estados §2): Server Component. Lee `searchParams`, los
 * normaliza contra los tipos del contrato (api-contracto §2.3) y consulta
 * SÓLO `catalogo` de `@/lib/catalogo` — sin `@/data/*`, sin `fetch`, sin
 * `app/api/` (checklist §6.4). Los resultados se pasan ya filtrados al panel
 * cliente; la URL es el único estado.
 */

/** Título con template del layout («Catálogo · Peache Perfumes»). */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Catálogo",
    description:
      "Todo el catálogo de Peache Perfumes: busca por nombre, filtra por familia olfativa y categoría, y ordénalo por precio o nombre.",
  };
}

/** Primer valor de un parámetro repetido (`?q=a&q=b` → «a»). */
function primero(valor: string | string[] | undefined): string {
  const suelto = Array.isArray(valor) ? valor[0] : valor;
  return typeof suelto === "string" ? suelto : "";
}

/** Las 7 familias de `FamiliaOlfativa` (D-DATOS-1), validadas por su rótulo. */
function esFamilia(valor: string): valor is FamiliaOlfativa {
  return FAMILIAS.some((entrada) => entrada.slug === valor);
}


export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Normalización defensiva de la URL: valores desconocidos o fuera de rango
  // se ignoran (la API devolvería 400/[] — §2.3—, la pantalla no: muestra el
  // listado por defecto en lugar de un estado vacío sin chip activo visible).
  const qCruda = primero(params.q).trim();
  const q = qCruda.length >= 2 && qCruda.length <= 60 ? qCruda : "";

  const familiaCruda = primero(params.familia);
  const familia: FamiliaOlfativa | null = esFamilia(familiaCruda)
    ? familiaCruda
    : null;

  // `?orden=` ausente o no representable por el selector → orden por defecto.
  const ordenCrudo = primero(params.orden);
  const orden: OrdenCatalogo = esOrdenVisible(ordenCrudo)
    ? ordenCrudo
    : ORDEN_DEFECTO;

  const categorias = await catalogo.listarCategorias();
  const categoriaCruda = primero(params.categoria);
  const categoria: string | null =
    categoriaCruda &&
    categorias.some((entrada) => entrada.slug === categoriaCruda)
      ? categoriaCruda
      : null;

  const productos = await catalogo.listarProductos({
    // `orden` SIEMPRE explícito: así la pantalla no depende del defecto del
    // endpoint (contrato y repositorio no coinciden en él — ver devolución).
    orden,
    busqueda: q || undefined,
    familia: familia ?? undefined,
    categoria: categoria ?? undefined,
  });

  return (
    <Contenedor ancho="ancho">
      <VistaCatalogo
        q={q}
        orden={orden}
        familia={familia}
        categoria={categoria}
        categorias={categorias.map((entrada) => ({
          id: entrada.slug,
          nombre: entrada.nombre,
        }))}
        conteo={productos.length}
      >
        {productos.length > 0 ? (
          <RejillaCatalogo>
            {productos.map((producto) => (
              <TarjetaProducto
                key={producto.id}
                producto={aDatosTarjeta(producto)}
              />
            ))}
          </RejillaCatalogo>
        ) : null}
      </VistaCatalogo>
    </Contenedor>
  );
}
