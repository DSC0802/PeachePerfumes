import type { OrdenCatalogo } from "@/lib/catalogo";

/**
 * Orden con el que `/catalogo` abre por defecto: cuando la URL no trae
 * `?orden=` (o lo trae con un valor que el selector no puede representar).
 *
 * `nombre-asc` es un orden de verdad — ordena los N productos sin ocultar
 * ninguno—, así el listado arranca completo («Listado completo»: mapa de rutas
 * de `docs/arquitectura.md`) y los chips de familia/categoría componen sobre
 * todo el catálogo. El contrato fija además el defecto del *endpoint* en
 * `destacados` (`api-contracto.md` §2.3), que en el repositorio actual **filtra**
 * a los destacados; la página envía siempre `?orden` explícito normalizado, de
 * modo que la UI no depende de ese defecto (ver devolución al PM: repo y
 * contrato no son espejo en el valor por defecto).
 */
export const ORDEN_DEFECTO: OrdenCatalogo = "nombre-asc";

interface OpcionOrden {
  valor: OrdenCatalogo;
  /** Texto literal de la opción (estados §2.1). */
  etiqueta: string;
}

/**
 * Las 4 opciones textuales del selector «Ordenar» de estados-y-responsividad
 * §2.1, en su orden, mapeadas 1:1 a `OrdenCatalogo`. `novedades` queda fuera:
 * §2.1 no lo pide (lo consume la portada con `listarProductos({orden:"novedades"})`).
 */
export const OPCIONES_ORDEN: readonly OpcionOrden[] = [
  { valor: "destacados", etiqueta: "Destacados" },
  { valor: "nombre-asc", etiqueta: "Nombre A→Z" },
  { valor: "precio-asc", etiqueta: "Precio: menor a mayor" },
  { valor: "precio-desc", etiqueta: "Precio: mayor a menor" },
];

/** ¿Es un valor de orden que el selector sabe mostrar? (normalización de URL) */
export function esOrdenVisible(valor: string): valor is OrdenCatalogo {
  return OPCIONES_ORDEN.some((opcion) => opcion.valor === valor);
}
