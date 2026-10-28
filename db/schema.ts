import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Esquema F3-A (docs/specs/2026-10-27-f3a-postgres-drizzle-design.md §3).
 * Tras el paso a USD (T5) espeja el contrato `lib/catalogo/tipos.ts`: la BD
 * guarda lo que la UI espera; la conversión de filas la hará `repositorio-postgres.ts`.
 */

/** Familia olfativa (D-DATOS-1) — mismos valores que `FamiliaOlfativa`. */
export const familiaOlfativa = pgEnum("familia_olfativa", [
  "citrico",
  "floral",
  "amaderado",
  "oriental",
  "frutal",
  "acuatico",
  "gourmand",
]);

/**
 * Estado de venta (HU-24). Creado ya en F3-A aunque la UI no lo use hasta
 * F3-C: evita una migración destructiva de la tabla al abrir el CRUD.
 */
export const estadoProducto = pgEnum("estado_producto", [
  "activo",
  "agotado",
  "descontinuado",
]);

export const categorias = pgTable(
  "categorias",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion").notNull(),
  },
  (tabla) => [
    // drizzle-kit 0.31 emite `.unique()` de columna como CONSTRAINT de tabla;
    // uniqueIndex() genera el CREATE UNIQUE INDEX que pide el plan F3-A.
    uniqueIndex("categorias_slug_unique").on(tabla.slug),
  ],
);

export const productos = pgTable(
  "productos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    marca: text("marca").notNull(),
    nombre: text("nombre").notNull(),
    tamano: text("tamano").notNull(),
    tamanoMl: integer("tamano_ml").notNull(),
    // numeric(10,2): pg lo entrega como string — Number() en el mapeo.
    precioUsd: numeric("precio_usd", { precision: 10, scale: 2 }).notNull(),
    descripcion: text("descripcion").notNull(),
    notasSalida: text("notas_salida").array().notNull(),
    notasCorazon: text("notas_corazon").array().notNull(),
    notasFondo: text("notas_fondo").array().notNull(),
    imagenSrc: text("imagen_src").notNull(),
    imagenAlt: text("imagen_alt").notNull(),
    // NOT NULL: `Producto.categoriaId` es obligatorio en el contrato.
    categoriaId: text("categoria_id")
      .notNull()
      .references(() => categorias.id),
    familia: familiaOlfativa("familia").notNull(),
    destacado: boolean("destacado").notNull().default(false),
    novedad: boolean("novedad").notNull().default(false),
    estado: estadoProducto("estado").notNull().default("activo"),
    oculto: boolean("oculto").notNull().default(false), // HU-23: ocultar, sin borrar
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    uniqueIndex("productos_slug_unique").on(tabla.slug),
    index("productos_categoria_idx").on(tabla.categoriaId),
    index("productos_familia_idx").on(tabla.familia),
    // Índice parcial: sólo filas visibles (spec §3).
    index("productos_estado_idx").on(tabla.estado).where(sql`oculto = false`),
  ],
);
