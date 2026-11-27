import { sql } from "drizzle-orm";
import {
  boolean,
  bytea,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
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
    // Imagen almacenada en Neon (bytea) para servirla vía API en Vercel
    imagenDatos: pgBytea("imagen_datos"),
    imagenTipo: text("imagen_tipo"),
    // NOT NULL: `Producto.categoriaId` es obligatorio en el contrato.
    categoriaId: text("categoria_id")
      .notNull()
      .references(() => categorias.id),
    familia: familiaOlfativa("familia").notNull(),
    destacado: boolean("destacado").notNull().default(false),
    novedad: boolean("novedad").notNull().default(false),
    estado: estadoProducto("estado").notNull().default("activo"),
    oculto: boolean("oculto").notNull().default(false), // HU-23: ocultar, sin borrar
    // F3-C: unidades disponibles (HU-20/21). Sólo lo ve el panel admin.
    stock: integer("stock").notNull().default(0),
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
    check("productos_stock_no_negativo", sql`${tabla.stock} >= 0`),
  ],
);

/* ===========================================================================
   Esquema F3-B — Identidad (docs/specs/2026-10-28-f3b-identidad-design.md §4)
   =========================================================================== */

/** Rol de usuario (spec F3-B §4) — espejo de `Rol` en `lib/auth/tipos.ts`. */
export const rolUsuario = pgEnum("rol_usuario", ["admin", "cliente"]);

/** Usuarios de la tienda (spec F3-B §4). */
export const usuarios = pgTable(
  "usuarios",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Normalizado en la app: trim + minúsculas (validadores.ts).
    email: text("email").notNull(),
    // Formato `scrypt$N$r$p$sal$clave` (spec F3-B §5) — nunca la contraseña cruda.
    passwordHash: text("password_hash").notNull(),
    nombre: text("nombre"), // perfil (HU-15), editable
    telefono: text("telefono"), // WhatsApp (HU-15), editable
    rol: rolUsuario("rol").notNull().default("cliente"),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    // CONSTRAINT UNIQUE (no índice): así las creó la migración 0001 en la BD.
    unique("usuarios_email_unique").on(tabla.email),
    index("usuarios_email_idx").on(tabla.email),
  ],
);

/** Sesiones activas (spec F3-B §4: expira_en fija a +30 días, sin sliding). */
export const sesiones = pgTable(
  "sesiones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    // SHA-256 del token en hex: NUNCA se guarda el token crudo (spec §11).
    tokenHash: text("token_hash").notNull(),
    creadaEn: timestamp("creada_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Sin default: la fija JS en `crearSesion` como creadaEn + 30 días.
    expiraEn: timestamp("expira_en", { withTimezone: true }).notNull(),
  },
  (tabla) => [
    unique("sesiones_token_hash_unique").on(tabla.tokenHash),
    index("sesiones_usuario_idx").on(tabla.usuarioId),
    // Limpieza de caducadas (spec §4): índice para `lt(expiraEn, now)`.
    index("sesiones_expira_idx").on(tabla.expiraEn),
  ],
);

/* ===========================================================================
   Esquema F3-C2 — Moneda (docs/specs/2026-11-05-f3c2-disponibilidad-moneda-design.md §3)
   =========================================================================== */

/**
 * Tasa «CUP por 1 USD» que fija el admin (HU-52). Cada cambio es una fila
 * nueva: la vigente es la más reciente y queda el historial de quién y cuándo.
 */
export const tasasCambio = pgTable(
  "tasas_cambio",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // numeric(12,2): pg lo entrega como string — Number() en el mapeo.
    cupPorUsd: numeric("cup_por_usd", { precision: 12, scale: 2 }).notNull(),
    creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
    usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  },
  (tabla) => [
    check("tasas_cambio_positiva", sql`${tabla.cupPorUsd} > 0`),
    index("tasas_cambio_creada_idx").on(tabla.creadaEn),
  ],
);

/* ===========================================================================
   Esquema F3-D — Pedidos (docs/specs/2026-11-05-f3d-pedidos-design.md §4)
   =========================================================================== */

/** Estados del pedido (decisión del cliente, spec F3-D §1). */
export const estadoPedido = pgEnum("estado_pedido", [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "en_camino",
  "entregado",
  "cancelado",
]);

/** Pedidos. Las cuentas se llevan en USD; el CUP nunca se congela (spec §1.4). */
export const pedidos = pgTable(
  "pedidos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Número visible «Nº 0007»: secuencial y único.
    numero: serial("numero").notNull(),
    // restrict: los pedidos son contabilidad; una cuenta con pedidos no se borra.
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    estado: estadoPedido("estado").notNull().default("pendiente"),
    totalUsd: numeric("total_usd", { precision: 12, scale: 2 }).notNull(),
    // Un intento de compra = una clave: repetir el envío no duplica el pedido.
    claveIdempotencia: text("clave_idempotencia").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (tabla) => [
    unique("pedidos_numero_unique").on(tabla.numero),
    unique("pedidos_clave_idempotencia_unique").on(tabla.claveIdempotencia),
    index("pedidos_usuario_idx").on(tabla.usuarioId),
    index("pedidos_estado_idx").on(tabla.estado),
    index("pedidos_creado_idx").on(tabla.creadoEn),
  ],
);

/** Líneas con instantánea del producto al pedir (el pedido no cambia si el producto cambia). */
export const pedidoLineas = pgTable(
  "pedido_lineas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id").references(() => productos.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    nombre: text("nombre").notNull(),
    marca: text("marca").notNull(),
    tamano: text("tamano").notNull(),
    precioUsd: numeric("precio_usd", { precision: 10, scale: 2 }).notNull(),
    cantidad: integer("cantidad").notNull(),
  },
  (tabla) => [
    check("pedido_lineas_cantidad_positiva", sql`${tabla.cantidad} > 0`),
    index("pedido_lineas_pedido_idx").on(tabla.pedidoId),
  ],
);

/** Historial de estados (HU-36): quién y cuándo. `usuario_id` null = el sistema. */
export const pedidoHistorial = pgTable(
  "pedido_historial",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    estado: estadoPedido("estado").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  },
  (tabla) => [index("pedido_historial_pedido_idx").on(tabla.pedidoId)],
);

/** Notificaciones del panel (HU-40/41). */
export const notificaciones = pgTable(
  "notificaciones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tipo: text("tipo").notNull(),
    pedidoId: uuid("pedido_id").references(() => pedidos.id, { onDelete: "cascade" }),
    leida: boolean("leida").notNull().default(false),
    creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (tabla) => [index("notificaciones_leida_idx").on(tabla.leida, tabla.creadaEn)],
);

/** Ajustes de la tienda (clave → valor), p. ej. `whatsapp_tienda`. */
export const ajustes = pgTable("ajustes", {
  clave: text("clave").primaryKey(),
  valor: text("valor").notNull(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).notNull().defaultNow(),
});
