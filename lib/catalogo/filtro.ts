import type { Categoria, Producto, ProductoFiltro } from "./tipos";

/**
 * Semántica de filtrado, orden y relacionados del catálogo
 * (api-contracto §2.3 y §2.5).
 *
 * Extraída de `repositorio-demo.ts` en F3-A para que el repositorio
 * Postgres aplique EXACTAMENTE los mismos filtros que el demo
 * (spec F3-A §6): una sola fuente de verdad => `tests/unit` (demo) y
 * `tests/integracion` (BD, T11) validan la misma lógica (spec F3-A §8).
 */

/** Resuelve el slug de categoría (query ?categoria=) a Categoria.id. */
function categoriaIdPorSlug(categorias: Categoria[], slug: string): string | null {
  return categorias.find((categoria) => categoria.slug === slug)?.id ?? null;
}

/**
 * Filtrado en memoria con la misma semántica que GET /api/v1/productos
 * (docs/api-contracto.md §2.3): categoría, familia olfativa, búsqueda en
 * nombre/marca/notas y orden. Devuelve [] sin lanzar cuando no hay
 * coincidencias, también con valores desconocidos de `categoria` o `familia`
 * (esta función no aplica los defaults ni la validación del contrato —p. ej.
 * `orden` por defecto o `familia` inválida → 400—: eso vive en la capa de
 * acceso). Si no hay filtros ni orden puede devolver el mismo array de
 * entrada: el caller no debe mutarlo (el repositorio demo siempre clona).
 */
export function aplicarFiltro(
  productos: Producto[],
  categorias: Categoria[],
  filtro?: ProductoFiltro,
): Producto[] {
  let resultado = productos;

  if (filtro?.categoria) {
    const categoriaId = categoriaIdPorSlug(categorias, filtro.categoria);
    // Categoría inexistente -> 200 con lista vacía (no es un error).
    resultado =
      categoriaId === null
        ? []
        : resultado.filter((producto) => producto.categoriaId === categoriaId);
  }

  if (filtro?.familia) {
    // Familia desconocida (p. ej. ?familia=loquesea) -> [] : ningún dato la
    // tiene, así que no queda ningún producto. Misma semántica que `categoria`.
    const familia = filtro.familia;
    resultado = resultado.filter((producto) => producto.familia === familia);
  }

  if (filtro?.busqueda) {
    const consulta = filtro.busqueda.trim().toLocaleLowerCase("es");
    if (consulta.length > 0) {
      resultado = resultado.filter((producto) =>
        [
          producto.nombre,
          producto.marca,
          ...producto.notas.salida,
          ...producto.notas.corazon,
          ...producto.notas.fondo,
        ]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(consulta),
      );
    }
  }

  switch (filtro?.orden) {
    case "nombre-asc":
      // A→Z en español, ignorando mayúsculas y acentos (D-DATOS-2; spec F3-A §6).
      resultado = [...resultado].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
      );
      break;
    case "precio-asc":
      resultado = [...resultado].sort((a, b) => a.precio - b.precio);
      break;
    case "precio-desc":
      resultado = [...resultado].sort((a, b) => b.precio - a.precio);
      break;
    case "novedades":
      resultado = resultado.filter((producto) => producto.novedad);
      break;
    case "destacados":
      resultado = resultado.filter((producto) => producto.destacado);
      break;
    default:
      // Sin orden (o valor desconocido procedente de la URL): orden del dato.
      break;
  }

  return resultado;
}

/**
 * Relacionados de la ficha (api-contracto §2.5): misma categoría, excluye
 * el actual, con límite (defecto 4). Devuelve [] si el slug no existe o si
 * `limite` es ≤ 0. Extraído de `repositorio-demo.ts` por el mismo motivo
 * que `aplicarFiltro`.
 */
export function seleccionarRelacionados(
  productos: Producto[],
  slug: string,
  limite = 4,
): Producto[] {
  const actual = productos.find((producto) => producto.slug === slug);
  if (actual === undefined) return [];
  const maximo = Math.max(0, limite);
  return productos
    .filter(
      (producto) =>
        producto.slug !== slug && producto.categoriaId === actual.categoriaId,
    )
    .slice(0, maximo);
}
