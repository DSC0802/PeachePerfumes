/**
 * DATOS DE DEMOSTRACIÓN: este tipo es el contrato estable del dominio.
 * Se mantiene idéntico cuando se pase a API real (ver docs/api-contracto.md).
 */
export type Moneda = "USD";

export type OrdenCatalogo =
  | "destacados"
  | "novedades"
  | "nombre-asc"
  | "precio-asc"
  | "precio-desc";

/**
 * Familia olfativa — `design` la exige en `estados-y-responsividad.md` §2.1
 * (chips de filtro con estado `?familia=floral`). Ver `docs/decisiones.md` D-DATOS-1.
 */
export type FamiliaOlfativa =
  | "citrico"
  | "floral"
  | "amaderado"
  | "oriental"
  | "frutal"
  | "acuatico"
  | "gourmand";

export interface Producto {
  /** Identificador estable, único. En demo: "p001". En API: id de la BD. */
  id: string;
  /** Slug URL-amigable, único, usado en /producto/[slug]. Minúsculas y guiones. */
  slug: string;
  /** Marca (ficticia en demo). Ej: "Casa Palma". */
  marca: string;
  /** Nombre comercial del perfume. Ej: "Brisa de Coco". */
  nombre: string;
  /** Tamaño en texto tal cual se muestra. Ej: "100 ml", "50 ml", "30 ml". */
  tamano: string;
  /** Volumen numérico en ml, para ordenar/filtrar sin parsear texto. */
  tamanoMl: number;
  /** Precio en unidades de la moneda, sin símbolo. Ej: 47. Decimales permitidos. */
  precio: number;
  moneda: Moneda;
  /** Párrafo de venta, 1–3 frases. */
  descripcion: string;
  /** Pirámide olfativa. Cada entrada es una nota, ya compuesta en texto. */
  notas: {
    salida: string[];
    corazon: string[];
    fondo: string[];
  };
  imagen: {
    /** Ruta local en /public. Ej: "/productos/brisa-de-coco.webp" */
    src: string;
    /** Texto alternativo obligatorio y descriptivo (a11y). */
    alt: string;
  };
  /** Relación con Categoria.id */
  categoriaId: string;
  /** Familia olfativa; alimenta los chips de filtro (?familia=). Ver decisiones D-DATOS-1. */
  familia: FamiliaOlfativa;
  /** Aparece en "Destacados" de la landing. */
  destacado: boolean;
  /** Llega recientemente; muestra etiqueta "Nuevo". */
  novedad: boolean;
  /**
   * F3-C2 (HU-27): se puede comprar ahora. `false` = se muestra «Agotado» y no
   * se añade al carrito. Es lo ÚNICO que sale del stock/estado del panel: la
   * tienda nunca recibe cifras de stock ni el estado interno.
   */
  disponible: boolean;
}

/** Producto tal y como se escribe en `data/` (la disponibilidad la pone el repositorio). */
export type ProductoDemo = Omit<Producto, "disponible">;

export interface Categoria {
  id: string;
  /** Slug para ?categoria= en /catalogo */
  slug: string;
  /** Nombre visible. Ej: "Mujer". */
  nombre: string;
  /** Breve descripción para la cabecera del catálogo. */
  descripcion: string;
}

/** Filtro común: es ESPEJO de los query params de GET /api/v1/productos. */
export interface ProductoFiltro {
  /** slug de la categoría (equivale a ?categoria=) */
  categoria?: string;
  /** familia olfativa (equivale a ?familia=) — ver decisiones D-DATOS-1 */
  familia?: FamiliaOlfativa;
  /** texto libre en nombre, marca y notas (equivale a ?q=) */
  busqueda?: string;
  /** equivale a ?orden= */
  orden?: OrdenCatalogo;
}
