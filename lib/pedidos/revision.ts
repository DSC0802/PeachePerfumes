/**
 * Revisión del carrito contra el catálogo actual (F3-D, HU-31). Pura: recibe
 * las líneas del carrito y el estado real de cada producto, y devuelve el vale
 * que se puede confirmar con los avisos de cada cambio.
 */

/** Máximo de unidades por línea (spec §5). */
export const CANTIDAD_MAXIMA = 10;
/** Máximo de pedidos `pendiente` a la vez por cliente (spec §5). */
export const PENDIENTES_MAXIMOS = 3;

export interface LineaCarrito {
  slug: string;
  cantidad: number;
  /** Precio USD que el cliente vio al añadirlo. */
  precioVisto: number;
}

/** Estado actual del producto según el servidor (null = ya no está en la tienda). */
export interface ProductoActual {
  slug: string;
  nombre: string;
  marca: string;
  tamano: string;
  precioUsd: number;
  disponible: boolean;
  stock: number;
}

export type AvisoLinea =
  | { tipo: "precio"; antes: number; ahora: number }
  | { tipo: "cantidad"; antes: number; ahora: number }
  | { tipo: "no_disponible" };

export interface LineaRevisada {
  slug: string;
  nombre: string;
  marca: string;
  tamano: string;
  precioUsd: number;
  cantidad: number;
  subtotalUsd: number;
  avisos: AvisoLinea[];
  /** false = no entra en el pedido (se quitará). */
  incluida: boolean;
}

export interface ValeRevisado {
  lineas: LineaRevisada[];
  totalUsd: number;
  /** Hay líneas incluidas: se puede confirmar. */
  confirmable: boolean;
  /** Hubo algún cambio respecto a lo que el cliente vio. */
  conCambios: boolean;
}

const centimos = (n: number) => Math.round(n * 100) / 100;

/** Une líneas repetidas del mismo slug y limpia cantidades (enteras, 1–10). */
export function normalizarLineas(lineas: LineaCarrito[]): LineaCarrito[] {
  const porSlug = new Map<string, LineaCarrito>();
  for (const linea of lineas) {
    if (!linea.slug) continue;
    const cantidad = Math.floor(Number(linea.cantidad));
    if (!Number.isFinite(cantidad) || cantidad < 1) continue;
    const previa = porSlug.get(linea.slug);
    porSlug.set(linea.slug, {
      slug: linea.slug,
      precioVisto: Number(linea.precioVisto) || 0,
      cantidad: Math.min(CANTIDAD_MAXIMA, (previa?.cantidad ?? 0) + cantidad),
    });
  }
  return [...porSlug.values()];
}

export function revisarCarrito(
  lineas: LineaCarrito[],
  actuales: Map<string, ProductoActual>,
): ValeRevisado {
  const revisadas: LineaRevisada[] = normalizarLineas(lineas).map((linea) => {
    const actual = actuales.get(linea.slug);
    if (!actual || !actual.disponible || actual.stock < 1) {
      return {
        slug: linea.slug,
        nombre: actual?.nombre ?? linea.slug,
        marca: actual?.marca ?? "",
        tamano: actual?.tamano ?? "",
        precioUsd: actual?.precioUsd ?? linea.precioVisto,
        cantidad: 0,
        subtotalUsd: 0,
        avisos: [{ tipo: "no_disponible" }],
        incluida: false,
      };
    }
    const avisos: AvisoLinea[] = [];
    if (centimos(actual.precioUsd) !== centimos(linea.precioVisto)) {
      avisos.push({ tipo: "precio", antes: linea.precioVisto, ahora: actual.precioUsd });
    }
    const cantidad = Math.min(linea.cantidad, actual.stock);
    if (cantidad !== linea.cantidad) {
      avisos.push({ tipo: "cantidad", antes: linea.cantidad, ahora: cantidad });
    }
    return {
      slug: actual.slug,
      nombre: actual.nombre,
      marca: actual.marca,
      tamano: actual.tamano,
      precioUsd: actual.precioUsd,
      cantidad,
      subtotalUsd: centimos(actual.precioUsd * cantidad),
      avisos,
      incluida: true,
    };
  });

  const incluidas = revisadas.filter((l) => l.incluida);
  return {
    lineas: revisadas,
    totalUsd: centimos(incluidas.reduce((s, l) => s + l.subtotalUsd, 0)),
    confirmable: incluidas.length > 0,
    conCambios: revisadas.some((l) => l.avisos.length > 0),
  };
}
