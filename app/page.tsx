import type { Metadata } from "next";
import { catalogo, type Producto } from "@/lib/catalogo";
import Hojeador from "@/components/landing/Hojeador";
import PasosPedido from "@/components/landing/PasosPedido";
import Portada from "@/components/landing/Portada";
import SeccionExplorar, { type FilaFamilia } from "@/components/landing/SeccionExplorar";
import { FAMILIAS } from "@/components/landing/familias";

/**
 * Portada (mundo «revista de perfumes», 2026-11-07): portada con el perfume
 * destacado → «En este número», un perfume por página que se hojea →
 * índice por familias → cómo comprar. Datos desde `@/lib/catalogo`.
 */

const LIMITE_PAGINAS = 8;

export const metadata: Metadata = {
  description:
    "Peache Perfumes: perfumes originales en Cuba con precio publicado y pago en efectivo al recibir.",
};

/** Perfume con más stock disponible (para la portada, a la derecha). */
async function productoConMasStock(): Promise<Producto | null> {
  return catalogo.obtenerProductoConMasStock();
}

/** Recuento y notas más repetidas por familia, a partir del catálogo real. */
function indiceFamilias(productos: Producto[]): FilaFamilia[] {
  return FAMILIAS.map(({ slug, nombre }) => {
    const deFamilia = productos.filter((p) => p.familia === slug);
    const frecuencia = new Map<string, number>();
    for (const p of deFamilia) {
      for (const nota of [...p.notas.salida, ...p.notas.corazon, ...p.notas.fondo]) {
        const clave = nota.trim().toLowerCase();
        frecuencia.set(clave, (frecuencia.get(clave) ?? 0) + 1);
      }
    }
    const notas = [...frecuencia.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .slice(0, 4)
      .map(([nota]) => nota);
    return { slug, nombre, total: deFamilia.length, notas };
  });
}

export default async function PaginaInicio() {
  const [todos, categorias] = await Promise.all([
    catalogo.listarProductos(),
    catalogo.listarCategorias(),
  ]);
  const enPortada = await productoConMasStock();
  // Las páginas del número: todos los productos sin repetir el de portada.
  const paginas = todos.filter((p) => p.slug !== enPortada?.slug).slice(0, LIMITE_PAGINAS);

  return (
    <>
      <Portada
        titulo="Perfumes originales."
        entradilla="Estamos en Línea #1265 e/ 20 y 22 (Vedado). Precio publicado y pago en efectivo contra entrega."
        producto={enPortada}
      />

      <Hojeador productos={paginas} />

      <SeccionExplorar familias={indiceFamilias(todos)} categorias={categorias} />

      <PasosPedido />
    </>
  );
}
