# Plan F3-A — Catálogo en PostgreSQL (local → nube)

**Spec (aprobado por el cliente):** `docs/specs/2026-10-27-f3a-postgres-drizzle-design.md`
**Fecha:** 2026-10-27 · **Estado:** aprobado por el cliente («adelante», 27/10/2026) — en ejecución
**Alcance:** primer bloque de la Fase 3, únicamente lo que delimita el spec §1.

**Aprobaciones explícitas del cliente previas a este plan (`AGENTS.md`):**

1. Instalar **PostgreSQL local vía `winget` + UAC** (ventana de control de usuario que el cliente aprueba).
2. Añadir **`tsx`** como dependencia de desarrollo para ejecutar `db/seed.ts`.
3. Dependencias listadas en el spec §2: `drizzle-orm`, `pg`, `drizzle-kit`, `@types/pg`.

## 0 · Contexto para quien ejecute este plan

- **Repo:** `C:\Users\sueir\Dev\PeachePerfumes` (git, árbol limpio, 3 commits). Shell PowerShell (Windows).
- **Convenciones del código:** comentarios y mensajes en **español con tildes**; punto y coma al final; comillas dobles; sangría de 2 espacios; archivos `.ts/.tsx` en minúsculas.
- **Prohibido (`AGENTS.md`):** instalar algo sin permiso (aquí ya concedido para lo listado arriba), cambios destructivos sin confirmar, tocar `~/.config/opencode/`, desactivar o «arreglar» tests para que pasen.
- **Regla dura del spec §8:** ningún test se toca para hacer pasar el cambio; un fallo es un bug de la app y se corrige en la app. La única edición permitida en tests es la de la Tarea 5 y es de **comentarios** (no aserciones), documentada en `decisiones.md` (Tarea 12).
- **Prerrequisito de las puertas de verificación (Tarea 13):** el servicio de PostgreSQL debe estar **arrancado** y la BD `peache` **sembrada**, porque `.env.local` apunta a `FUENTE_CATALOGO=postgres` y `next build` prerenderiza consultando la BD. Si la BD está caída, `npm run build` falla ruidosamente — eso es correcto (spec §7: sin fallback).
- **Estructura del plan:** cada tarea indica objetivo, archivos, código **completo**, pasos de ejecución y su verificación. Los commits son acumulativos (C1…C7) y sólo se hacen en verde.

## 1 · Mapa de archivos

| Archivo | Acción | Tarea |
|---|---|---|
| `db/schema.ts` | NUEVO — esquema Drizzle (`productos`, `categorias`, 2 enums, 3 índices) | T4 |
| `db/migraciones/*.sql` | NUEVO — generados por `drizzle-kit generate` | T4 |
| `db/seed.ts` | NUEVO — semilla idempotente de 14 productos + 3 categorías | T7 |
| `drizzle.config.ts` | NUEVO — configuración de Drizzle (carga `.env.local` a mano) | T3 |
| `.env.local` | NUEVO — `DATABASE_URL`, `FUENTE_CATALOGO=postgres` (gitignored, **nunca se sube**) | T9 |
| `lib/catalogo/filtro.ts` | NUEVO — semántica de filtrado/orden extraída del demo (paridad demo⇄Postgres) | T6 |
| `lib/catalogo/repositorio-postgres.ts` | NUEVO — implementa `CatalogoRepositorio` contra la BD | T8 |
| `lib/catalogo/index.ts` | MODIFICA — conmutador `FUENTE_CATALOGO` (defecto `demo`) | T9 |
| `lib/catalogo/repositorio-demo.ts` | MODIFICA — delega en `filtro.ts` (sin cambio de comportamiento) | T6 |
| `lib/catalogo/tipos.ts` | MODIFICA — `Moneda` pasa a `"USD"` (spec §5) | T5 |
| `data/productos.ts` | MODIFICA — 14 precios a la tabla USD aprobada + `moneda: "USD"` | T5 |
| `data/README.md` | MODIFICA — comentario de precios CUP → USD | T5 |
| `components/ui/Precio.tsx` | MODIFICA — moneda por defecto `USD` | T5 |
| `components/carrito/Carrito.tsx` | MODIFICA — `MONEDA_DEFECTO = "USD"` | T5 |
| `tests/unit/catalogo.test.ts` | MODIFICA (sólo 2 comentarios CUP → USD; aserciones intactas) | T5 |
| `app/error.tsx` | NUEVO — red de seguridad de la raíz (la landing lee catálogo) | T10 |
| `vitest.config.ts` | MODIFICA — incluye `tests/integracion/`, fija `FUENTE_CATALOGO=demo` para unit | T11 |
| `tests/integracion/catalogo-postgres.test.ts` | NUEVO — suite espejo de 24 tests contra la BD | T11 |
| `package.json` | MODIFICA — deps + scripts `db:*` | T2/T3 |
| `docs/decisiones.md`, `docs/arquitectura.md`, `docs/api-contracto.md`, `docs/design/componentes.md`, `AGENTS.md`, `eslint.config.mjs` (sólo el comentario de la regla `data/**`) | MODIFICA — coherencia USD + estructura + stack | T12 |

**Sin cambios (por diseño):** `lib/catalogo/repositorio.ts` (interfaz), `app/**` salvo el nuevo `error.tsx`, `components/**` salvo los dos de moneda, `playwright.config.ts`, suites E2E/a11y existentes.

## 2 · Orden de tareas y dependencias

```
T1 PostgreSQL (winget+UAC, BD «peache»)      ── no toca el repo
T2 dependencias npm (drizzle, pg, kit, types, tsx)
T3 drizzle.config.ts + scripts db:*
T4 db/schema.ts → generate → migrate → \d     ── C1
T5 paso a USD (tipos, data, Precio, Carrito)  ── vitest 24/24 ── C2
T6 filtro compartido (filtro.ts + refactor demo) ── vitest 24/24 ── C3
T7 db/seed.ts → sembrar ×2 → counts           ── C4
T8 repositorio-postgres.ts (compila, typecheck)
T9 conmutador + .env.local
T10 app/error.tsx                             ── C5
T11 suite espejo (tests/integracion) ── vitest 48/48 ── C6
T12 docs (decisiones, arquitectura, contrato, AGENTS)
T13 puerta final: 5 gates + evidencias         ── C7
```

Dependencias reales: T5 antes que T7 (la semilla importa `data/productos.ts` ya en USD); T6 y T7 antes que T8 (el repositorio usa `filtro.ts`); T7 antes que T9/T13 (nada puede consultar la BD sin sembrar); **T9 antes que T11** (la suite espejo lee `DATABASE_URL` de `.env.local`, que se crea en T9) **y antes que T13** (los gates finales exigen `FUENTE_CATALOGO=postgres`).

## 3 · Tareas

### T1 · Instalar PostgreSQL local y crear la BD `peache`

**Objetivo:** servidor PostgreSQL corriendo como servicio (arranca con Windows) y una base de datos `peache` vacía.
**No toca el repo.** Requiere interacción del cliente (ventana UAC + GUI del instalador).

1. Ver versiones disponibles en winget (hoy suele haber `.17` y `.18`; se instala la más alta que aparezca):

   ```powershell
   winget search PostgreSQL.PostgreSQL
   ```

2. Instalar (sustituir `.18` por `.17` si sólo existe esa):

   ```powershell
   winget install --id PostgreSQL.PostgreSQL.18 --source winget --accept-package-agreements --accept-source-agreements
   ```

   - **UAC:** aparecerá una ventana de control de usuario → el cliente pulsa **Sí**.
   - **GUI del instalador (cliente):** en «Password» introduce y anota la contraseña de `postgres` (va después a `.env.local`); puerto **5432**; el resto por defecto («Initialize database cluster» marcado).

3. Localizar `psql` con ruta completa — la sesión actual puede no tener el PATH actualizado:

   ```powershell
   $psql = (Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" | Sort-Object FullName -Descending | Select-Object -First 1).FullName
   Write-Output $psql
   ```

4. Crear la BD (pedirá la contraseña):

   ```powershell
   & $psql -U postgres -c "CREATE DATABASE peache;"
   ```

5. **Verificación (guardar la salida literal):**

   ```powershell
   Get-Service *postgres* | Select-Object Name, Status   # → Running
   & $psql -U postgres -d peache -c "SELECT version();"
   ```

Si `winget` no existe o el instalador falla: descargar el instalador oficial de EDB a mano (`https://www.postgresql.org/download/windows/`) con los mismos pasos (4-5) y reintentar. No continuar sin la verificación.

### T2 · Dependencias npm (aprobadas: spec §2 + `tsx`)

```powershell
npm install drizzle-orm pg
npm install --save-dev drizzle-kit @types/pg tsx
```

**Verificación:** `npm ls drizzle-orm pg drizzle-kit @types/pg tsx --depth=0` → los 5 paquetes listados; `package.json` sólo cambia en `dependencies`/`devDependencies`.

### T3 · `drizzle.config.ts` + scripts `db:*`

**Archivo nuevo `drizzle.config.ts`** (no está en el lint: `eslint.config.mjs` ignora `*.config.ts`; sí lo está en `typecheck`):

```ts
import { defineConfig } from "drizzle-kit";

// drizzle-kit NO carga .env.local (sólo Next.js lo hace para la app):
// hay que leerlo antes de construir la configuración.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local el error claro lo lanza la comprobación de abajo.
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "Falta DATABASE_URL en .env.local: copia la cadena de conexión de PostgreSQL (spec F3-A §7).",
  );
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migraciones",
  dialect: "postgresql",
  dbCredentials: { url },
});
```

**`package.json`** — añadir al bloque `scripts` (tras `test:a11y`):

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "tsx db/seed.ts",
"db:studio": "drizzle-kit studio"
```

**Verificación:** `npx drizzle-kit help` → imprime la ayuda (o `npx drizzle-kit --version` → la versión) y sale con 0: el binario existe. `db:generate` se prueba en T4, cuando ya hay esquema.

### T4 · Esquema Drizzle + migración aplicada

**Archivo nuevo `db/schema.ts`:**

```ts
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  sql,
  text,
  timestamp,
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

export const categorias = pgTable("categorias", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
});

export const productos = pgTable(
  "productos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
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
    index("productos_categoria_idx").on(tabla.categoriaId),
    index("productos_familia_idx").on(tabla.familia),
    // Índice parcial: sólo filas visibles (spec §3).
    index("productos_estado_idx").on(tabla.estado).where(sql`oculto = false`),
  ],
);
```

**Pasos:**

1. `npm run db:generate` → crea `db/migraciones/0000_<nombre>.sql`.
2. **Leer la migración generada** y comprobar que contiene: `CREATE TABLE "categorias"`, `CREATE TABLE "productos"`, los dos `CREATE TYPE` (`familia_olfativa`, `estado_producto`), `CREATE UNIQUE INDEX` sobre `slug`, los 3 índices y el índice parcial `WHERE oculto = false`. Si `drizzle-kit` cambió su API y falta algo, se ajusta `db/schema.ts` aquí — no se deja nada a medias.

   > **Nota de ejecución (27/10/2026):** el bloque de código de T4 **no es ejecutable tal cual** con `drizzle-orm@0.45.4` / `drizzle-kit@0.31.11`; el ajuste queda autorizado por este mismo paso y se hizo en `db/schema.ts`: (a) `sql` se importa de `drizzle-orm` (no lo exporta `pg-core` → `TypeError: import_pg_core.sql is not a function`); (b) `slug` usa `uniqueIndex(...)` en el callback de tabla en vez de `.unique()` de columna, porque `.unique()` genera `CONSTRAINT ... UNIQUE` y aquí se exige `CREATE UNIQUE INDEX`. Registrado en `decisiones.md` (T12, **D-F3A-ESQUEMA**).
3. `npm run db:migrate` → debe terminar sin error.
4. **Verificación (guardar salida literal):**

   ```powershell
   & $psql -U postgres -d peache -c "\dt"
   & $psql -U postgres -d peache -c "\d productos"
   ```

   Esperado: 2 tablas (`categorias`, `productos`), columnas de la spec, enums y los índices visibles.

5. `npm run typecheck` → 0 (el esquema compila solo antes de que siga nada más).

**→ Commit C1:** `db/schema.ts`, `db/migraciones/`, `drizzle.config.ts`, `package.json` (+ lockfile).
Mensaje: `F3-A: esquema Drizzle y migración de catálogo (PostgreSQL local)`

### T5 · Moneda base USD (D5) en contrato, datos demo y componentes

**Objetivo:** `Moneda = "USD"` y los 14 precios con los valores aprobados por el cliente (spec §4). Al terminar, `data/productos.ts` es **idéntico en contenido** a lo que sembrará la BD → demo y Postgres indistinguibles.

1. **`lib/catalogo/tipos.ts`**
   - `export type Moneda = "CUP";` → `export type Moneda = "USD";`
   - Comentario del campo `precio` (línea ~40): `Ej: 2500` → `Ej: 47`.

2. **`data/productos.ts`**
   - `replaceAll`: `moneda: "CUP"` → `moneda: "USD"` (14 coincidencias).
   - Cabecera (líneas 12-13): sustituir

     ```ts
     * Los precios están en CUP pero son de demostración: la moneda y la política de
     * precios reales son una decisión pendiente (docs/arquitectura.md §12, D5).
     ```

     por

     ```ts
     * Los precios están en USD (moneda base, decisión D5) y son la
     * misma escala que usa la semilla de PostgreSQL (docs/specs/2026-10-27-f3a-postgres-drizzle-design.md §4).
     * La tasa CUP/USD la fija el administrador en el Dashboard (F3-C).
     ```

   - **14 precios** (los valores viejos son únicos en el archivo; editar `precio: <viejo>,` → `precio: <nuevo>,`):

     | slug | CUP hoy | USD nuevo | | slug | CUP hoy | USD nuevo |
     |---|---|---|---|---|---|---|
     | rosa-de-batey | 1350 | **25** | | brisa-de-coco-100 | 2500 | **47** |
     | manglar | 1450 | **27** | | azahar-de-luna | 2650 | **49** |
     | cafe-de-siesta | 1690 | **32** | | alba | 2980 | **55** |
     | sandia-de-verano | 1780 | **34** | | vainilla-de-playa | 3200 | **59** |
     | rio-cristal | 1890 | **35** | | cedro-nocturno | 3900 | **69** |
     | sal-y-coral | 2150 | **39** | | amber-real | 4200 | **79** |
     | duna | 2350 | **44** | | ebano | 4500 | **89** |

3. **`components/ui/Precio.tsx`**
   - Comentario: `Defecto: CUP` → `Defecto: USD`.
   - `moneda = "CUP",` → `moneda = "USD",`.

4. **`components/carrito/Carrito.tsx`**
   - `const MONEDA_DEFECTO = "CUP";` → `const MONEDA_DEFECTO = "USD";`.

5. **`data/README.md`**
   - `Precios de demostración en CUP` → `Precios de demostración en USD (D5)`.

6. **`tests/unit/catalogo.test.ts` — SOLO comentarios, las aserciones no se tocan:**
   - `expect(productos[0].nombre).toBe("Rosa de Batey"); // 1350 CUP` → `// 25 USD`
   - `expect(productos[productos.length - 1].nombre).toBe("Ébano"); // 4500 CUP` → `// 89 USD`

**Verificación:**

```powershell
npx vitest run        # → 24/24, exit 0
```

Las aserciones de orden siguen ciertas porque **el orden relativo se conserva** (Rosa de Batey 25 = más barato, Ébano 89 = más caro) y ninguna aserción afirma un valor CUP. Si algo falla, es un bug real: se corrige en los datos/código, jamás desactivando el test (spec §8).

**→ Commit C2:** `tipos.ts`, `data/productos.ts`, `data/README.md`, `Precio.tsx`, `Carrito.tsx`, `tests/unit/catalogo.test.ts`.
Mensaje: `F3-A: moneda base USD con los precios aprobados (D5)`

### T6 · Semántica de filtrado compartida (paridad demo ⇄ Postgres)

**Objetivo:** una sola implementación de filtros/orden que usen **ambos** repositorios, para que las dos suites prueben la misma lógica y no puedan divergir. Es una refactorización de código existente: **cero cambio de comportamiento**.

**Archivo nuevo `lib/catalogo/filtro.ts`:**

```ts
import type { Categoria, Producto, ProductoFiltro } from "./tipos";

/**
 * Semántica de filtrado y orden del catálogo (api-contracto §2.3).
 *
 * Extraída de `repositorio-demo.ts` en F3-A para que el repositorio
 * Postgres aplique EXACTAMENTE los mismos filtros que el demo
 * (spec F3-A §6): una sola fuente de verdad => `tests/unit` (demo) y
 * `tests/integracion` (BD) validan la misma lógica.
 */

/** Resuelve el slug de categoría (query ?categoria=) a Categoria.id. */
function categoriaIdPorSlug(categorias: Categoria[], slug: string): string | null {
  return categorias.find((categoria) => categoria.slug === slug)?.id ?? null;
}

/**
 * Filtrado en memoria con la misma semántica que GET /api/v1/productos
 * (docs/api-contracto.md §2.3): categoría, familia olfativa, búsqueda en
 * nombre/marca/notas y orden. Devuelve [] sin lanzar cuando no hay
 * coincidencias, también con valores desconocidos de `categoria` o `familia`.
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
    // tiene, así que el filtro no vacía nada. Misma semántica que `categoria`.
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
      // A→Z en español, ignorando mayúsculas y acentos (decisiones D-DATOS-2).
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
 * Relacionados de la ficha: misma categoría, excluye el actual, con límite.
 * Extraído de `repositorio-demo.ts` por el mismo motivo que `aplicarFiltro`.
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
```

> **Notas de ejecución (27/10/2026, tras la revisión de calidad de T6):** en `filtro.ts` se afinaron comentarios heredados que eran imprecisos al pie de la letra (cabecera: añade §2.5, §8 y marca `tests/integracion` como T11; JSDoc de `aplicarFiltro`: advierte de que no aplica defaults/validación del contrato ni copia el array de entrada; comentario de familia desconocida decía «no vacía nada» justo donde sí vacía; la cita de `nombre-asc` añade spec §6; el JSDoc de `seleccionarRelacionados` documenta `[]` con slug inexistente o `limite ≤ 0`). Además **se quitó el `limite = 4` de la firma demo** (`async listarRelacionados(slug, limite)`): el defecto vive SOLO en `seleccionarRelacionados` — un default duplicado en dos capas sería exactamente la divergencia demo⇄Postgres que esta tarea elimina. Lógica intacta (24/24, typecheck 0, lint 0); el snippet de abajo conserva el `= 4` original, la fuente de verdad es el código.

**Modificar `lib/catalogo/repositorio-demo.ts` (delegar, sin cambiar resultados):**

- Borrar las funciones locales `categoriaIdPorSlug` (líneas 30-33) y `aplicarFiltro` (líneas 35-103).
- Añadir imports:

  ```ts
  import { aplicarFiltro, seleccionarRelacionados } from "./filtro";
  ```

  (junto a los imports existentes; `categoriasDemo` sigue importándose para `listarCategorias`).

- Los tres métodos quedan:

  ```ts
  async listarProductos(filtro) {
    return aplicarFiltro(productosDemo, categoriasDemo, filtro).map(clonarProducto);
  },

  async listarRelacionados(slug, limite = 4) {
    return seleccionarRelacionados(productosDemo, slug, limite).map(clonarProducto);
  },

  async contarProductos(filtro) {
    return aplicarFiltro(productosDemo, categoriasDemo, filtro).length;
  },
  ```

- `obtenerProductoPorSlug` y `listarCategorias` no cambian (`buscarPorSlug`, `clonarProducto`, `clonarCategoria` se quedan).
- Comentario de la cabecera (líneas 6-7): tras la T12 quedará actualizado el «ÚNICA puerta» — de momento dejarlo; se toca en T12.

**Verificación:** `npx vitest run` → 24/24 (mismo comportamiento) · `npm run typecheck` → 0 · `npm run lint` → 0.

**→ Commit C3:** `lib/catalogo/filtro.ts`, `lib/catalogo/repositorio-demo.ts`.
Mensaje: `F3-A: filtra y ordena en un módulo compartido (paridad demo/Postgres)`

### T7 · Semilla idempotente `db/seed.ts` (HU-61)

**Objetivo:** cargar en la BD los 14 productos y 3 categorías de `data/` (misma fuente → cero duplicación) de forma re-ejecutable.

**Archivo nuevo `db/seed.ts`** (la cabecera del archivo es la del propio bloque):

```ts
/**
 * SEMILLA de fábrica (HU-61, spec F3-A §4).
 *
 * Idempotente: re-ejecutarla restaura categorías y productos a los datos de
 * `data/` dentro de una transacción (borra y re-inserta; no duplica nada).
 * Uso: `npm run db:seed` — requiere `.env.local` con DATABASE_URL y la BD creada.
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { categorias } from "../data/categorias";
import { productos } from "../data/productos";
import { categorias as tablaCategorias, productos as tablaProductos } from "./schema";

async function sembrar(): Promise<void> {
  // Los `import` de arriba no leen el entorno; `.env.local` se carga aquí,
  // antes de tocar DATABASE_URL (Next.js lo carga solo para la app, no para tsx).
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Sin .env.local: el error claro lo lanza la comprobación de abajo.
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL en .env.local: configura la cadena de conexión de PostgreSQL.",
    );
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const db = drizzle(pool);

    await db.transaction(async (transaccion) => {
      // Orden de borrado por la FK productos → categorias.
      await transaccion.delete(tablaProductos);
      await transaccion.delete(tablaCategorias);

      await transaccion.insert(tablaCategorias).values(
        categorias.map((categoria) => ({
          id: categoria.id,
          slug: categoria.slug,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
        })),
      );

      await transaccion.insert(tablaProductos).values(
        productos.map((producto) => ({
          slug: producto.slug,
          marca: producto.marca,
          nombre: producto.nombre,
          tamano: producto.tamano,
          tamanoMl: producto.tamanoMl,
          // numeric(10,2): el driver espera string.
          precioUsd: String(producto.precio),
          descripcion: producto.descripcion,
          notasSalida: producto.notas.salida,
          notasCorazon: producto.notas.corazon,
          notasFondo: producto.notas.fondo,
          imagenSrc: producto.imagen.src,
          imagenAlt: producto.imagen.alt,
          categoriaId: producto.categoriaId,
          familia: producto.familia,
          destacado: producto.destacado,
          novedad: producto.novedad,
        })),
      );
      // estado y oculto toman sus defaults: 'activo' y false (spec §4).
    });

    const [totalProductos] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tablaProductos);
    const [totalCategorias] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tablaCategorias);

    console.log(
      `✓ Semilla aplicada: ${totalProductos.n} productos y ${totalCategorias.n} categorías.`,
    );
  } finally {
    await pool.end();
  }
}

sembrar().catch((error: unknown) => {
  console.error("✗ Falló la semilla:", error);
  process.exitCode = 1;
});
```

**Pasos:**

1. `npm run db:seed` → `✓ Semilla aplicada: 14 productos y 3 categorías.`
2. **Re-ejecutar** `npm run db:seed` → salida idéntica (prueba de idempotencia).
3. **Verificación (guardar salida literal):**

   ```powershell
   & $psql -U postgres -d peache -c "SELECT count(*) FROM productos; SELECT count(*) FROM categorias;"
   ```

   → `14` y `3` tras ambas ejecuciones (nunca 28).

**→ Commit C4:** `db/seed.ts`. Mensaje: `F3-A: semilla idempotente de 14 productos en USD`

### T8 · Repositorio Postgres `lib/catalogo/repositorio-postgres.ts`

**Objetivo:** implementar la interfaz `CatalogoRepositorio` (5 métodos) contra la BD. **Estrategia de paridad (decisión D-F3A-FILTRO, T12):** SQL sólo **selecciona** las filas visibles y busca por `slug` — el filtrado y el orden los hace el mismo `filtro.ts` que el demo. Así los 5 `OrdenCatalogo` (incluido `nombre-asc` con `localeCompare("es")`) y la búsqueda son idénticos por construcción, sin depender de la colación del clúster. El filtro migrará a SQL cuando haya paginación real (F3-C+). Si la BD no responde, el método **lanza** (spec §7: sin fallback).

**Archivo nuevo `lib/catalogo/repositorio-postgres.ts`:**

```ts
import { and, eq, not } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  categorias as tablaCategorias,
  productos as tablaProductos,
} from "../../db/schema";
import { aplicarFiltro, seleccionarRelacionados } from "./filtro";
import type { CatalogoRepositorio } from "./repositorio";
import type { Categoria, Producto, ProductoFiltro } from "./tipos";

type FilaProducto = typeof tablaProductos.$inferSelect;
type FilaCategoria = typeof tablaCategorias.$inferSelect;

// Pool perezoso por proceso: Next (y vitest) crean el módulo varias veces en
// desarrollo; un pool evita agotar conexiones con la recarga en caliente.
let pool: Pool | null = null;

function obtenerBase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL en .env.local: la tienda no puede leer el catálogo (spec F3-A §7).",
    );
  }
  pool ??= new Pool({ connectionString: url, max: 5 });
  return drizzle(pool); // el tipo se infiere: `drizzle` está sobrecargado
}

/** Fila → dominio. Jamás se expone un Row de BD fuera de este archivo. */
function aProducto(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    slug: fila.slug,
    marca: fila.marca,
    nombre: fila.nombre,
    tamano: fila.tamano,
    tamanoMl: fila.tamanoMl,
    // numeric(10,2) llega como string desde pg.
    precio: Number(fila.precioUsd),
    moneda: "USD",
    descripcion: fila.descripcion,
    notas: {
      salida: [...fila.notasSalida],
      corazon: [...fila.notasCorazon],
      fondo: [...fila.notasFondo],
    },
    imagen: { src: fila.imagenSrc, alt: fila.imagenAlt },
    categoriaId: fila.categoriaId,
    familia: fila.familia,
    destacado: fila.destacado,
    novedad: fila.novedad,
  };
}

function aCategoria(fila: FilaCategoria): Categoria {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
  };
}

/** Todo lo visible: `oculto = false` es la HU-23 (ocultar, sin borrar). */
async function cargarVisibles(): Promise<{
  productos: Producto[];
  categorias: Categoria[];
}> {
  const db = obtenerBase();
  const [filasProductos, filasCategorias] = await Promise.all([
    db.select().from(tablaProductos).where(not(tablaProductos.oculto)),
    db.select().from(tablaCategorias),
  ]);
  return {
    productos: filasProductos.map(aProducto),
    categorias: filasCategorias.map(aCategoria),
  };
}

async function listarProductosInterno(filtro?: ProductoFiltro): Promise<Producto[]> {
  const { productos, categorias } = await cargarVisibles();
  return aplicarFiltro(productos, categorias, filtro);
}

export const repositorioPostgres: CatalogoRepositorio = {
  listarProductos: listarProductosInterno,

  async contarProductos(filtro) {
    return (await listarProductosInterno(filtro)).length;
  },

  async obtenerProductoPorSlug(slug) {
    const db = obtenerBase();
    const [fila] = await db
      .select()
      .from(tablaProductos)
      .where(and(eq(tablaProductos.slug, slug), not(tablaProductos.oculto)))
      .limit(1);
    return fila === undefined ? null : aProducto(fila);
  },

  async listarRelacionados(slug, limite = 4) {
    const { productos } = await cargarVisibles();
    return seleccionarRelacionados(productos, slug, limite);
  },

  async listarCategorias() {
    const db = obtenerBase();
    const filas = await db.select().from(tablaCategorias);
    return filas.map(aCategoria);
  },
};
```

**Verificación:** `npm run typecheck` → 0 · `npm run lint` → 0 (el archivo aún no se ejecuta: el conmutador sigue en `demo`; el comportamiento se prueba en T11).

### T9 · Conmutador `FUENTE_CATALOGO` + `.env.local`

**Modificar `lib/catalogo/index.ts` completo:**

```ts
import type { CatalogoRepositorio } from "./repositorio";
import { repositorioDemo } from "./repositorio-demo";
import { repositorioPostgres } from "./repositorio-postgres";

export * from "./tipos";
export type { CatalogoRepositorio };

/**
 * ÚNICO punto de entrada de `app/` y `components/` hacia los datos del catálogo
 * (docs/arquitectura.md §6). F3-A: conmutador demo ⇄ PostgreSQL (spec §6).
 * - `FUENTE_CATALOGO=postgres` → BD local (`.env.local`).
 * - Cualquier otro valor, incluido ausente → demo: quien no configura nada
 *   sigue funcionando como hoy (CI, revisores). Sin fallback en runtime:
 *   si la BD falla, el repositorio lanza y la ruta muestra su error.tsx (§7).
 */
const fuente = process.env.FUENTE_CATALOGO;
export const catalogo: CatalogoRepositorio =
  fuente === "postgres" ? repositorioPostgres : repositorioDemo;
```

**Archivo nuevo `.env.local`** (gitignored desde Fase 1 — verificar con `git status --porcelain` que NO aparece).

> **Nota de ejecución (orquestador):** en la práctica se crea **al terminar T1**, antes de T4: `drizzle-kit generate` carga `drizzle.config.ts`, que exige `DATABASE_URL`. La contraseña se sustituye en cuanto el cliente la facilita; `FUENTE_CATALOGO=postgres` no tiene efecto hasta que T9 lo lea.

```dotenv
# Conexión a PostgreSQL local (spec F3-A §6). NUNCA se sube a git.
DATABASE_URL=postgres://postgres:<password>@localhost:5432/peache

# Fuente del catálogo: postgres | demo (defecto demo si se omite).
FUENTE_CATALOGO=postgres
```

Sustituir `CONTRASENA_AQUI` por la contraseña elegida en T1.2.

**Verificación:** `git status --porcelain` → `.env.local` no listado · `npm run typecheck` → 0.

### T10 · `app/error.tsx` de la raíz (spec §7)

**Comprobación previa:** hoy sólo existen `app/catalogo/error.tsx` y `app/producto/[slug]/error.tsx`; **la landing `/` lee el catálogo y no tiene red**. Un `error.tsx` en la raíz cubre `/`, `/carrito` y cualquier ruta futura sin el suyo.

**Archivo nuevo `app/error.tsx`:**

```tsx
"use client";

import Boton from "@/components/ui/Boton";
import Contenedor from "@/components/ui/Contenedor";
import EstadoVacio from "@/components/ui/EstadoVacio";

/**
 * Error de la raíz (spec F3-A §7): red de seguridad para `/` (landing, que
 * lee catálogo) y para toda ruta sin su propio error.tsx. Igual patrón que
 * `app/catalogo/error.tsx`: `reset()` rehace el render sin recargar y no hay
 * fallback a datos demo — un fallo de BD se muestra, no se maquilla.
 */
export default function ErrorRaiz({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Contenedor>
      <EstadoVacio
        titulo="No pudimos cargar la página."
        apoyo="Revisa tu conexión e inténtalo de nuevo."
      >
        <Boton variante="secundario" onClick={reset}>
          Reintentar
        </Boton>
      </EstadoVacio>
    </Contenedor>
  );
}
```

**Verificación:** `npm run typecheck` → 0 · `npm run lint` → 0.

**→ Commit C5:** `repositorio-postgres.ts`, `index.ts`, `app/error.tsx` (¡`.env.local` NO!).
Mensaje: `F3-A: repositorio Postgres conmutado por FUENTE_CATALOGO + error de raíz`

### T11 · Suite espejo contra la BD (spec §8)

**Objetivo:** las mismas 24 aserciones de `tests/unit/catalogo.test.ts` ejecutadas contra PostgreSQL. Con BD disponible: 48 tests en total. Sin BD: 24 + 24 omitidas **con aviso visible** (nunca silencioso, nunca fingiendo).

**1. `vitest.config.ts` — contenido completo de reemplazo:**

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configuración de Vitest — suites de Node sin DOM (decisión D8).
 *
 * - `include`: `tests/**/*.test.ts` — unit (`tests/unit/`) + espejo Postgres
 *   (`tests/integracion/`, F3-A §8). Los specs de Playwright son `.spec.ts`
 *   y quedan fuera: sólo corren bajo su runner.
 * - `test.env.FUENTE_CATALOGO=demo`: la suite unit SIEMPRE prueba el
 *   repositorio demo, aunque exista `.env.local` con `postgres`. La suite
 *   espejo importa `repositorioPostgres` directamente y no depende de esto.
 * - Alias `@/*` idéntico al de `tsconfig.json`, para que los tests consuman
 *   la app igual que la UI.
 * - Entorno `node`: los tests son puros (sin DOM).
 */
const raiz = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": raiz,
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    env: {
      FUENTE_CATALOGO: "demo",
    },
  },
});
```

**2. Archivo nuevo `tests/integracion/catalogo-postgres.test.ts` — cabecera, guardia de conexión y envoltorio (código completo):**

```ts
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import type { CatalogoRepositorio } from "@/lib/catalogo/repositorio";
import { repositorioPostgres } from "@/lib/catalogo/repositorio-postgres";
import type { FamiliaOlfativa, OrdenCatalogo } from "@/lib/catalogo/tipos";

/**
 * Suite ESPEJO de `tests/unit/catalogo.test.ts` contra PostgreSQL real
 * (spec F3-A §8): mismas aserciones, otro repositorio — valida el mapeo
 * fila→dominio, la conexión y la semántica compartida (`filtro.ts`).
 *
 * Omisión visible: sin `.env.local`, o con la BD caída (>3 s), la suite se
 * salta con un aviso en la consola. Nunca se convierte un skip en verde
 * silencioso.
 *
 * Adaptación única respecto a la suite demo: la aserción
 * «el primer elemento es el primero del archivo de datos» no
 * existe en una tabla (PostgreSQL no garantiza orden de archivo), así que
 * se exige ESTABILIDAD: dos consultas seguidas dan la misma secuencia y un
 * `orden` desconocido no la altera. El resto es copia literal del archivo
 * unitario, cuerpos de `it` sin tocar.
 */

try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local no hay DATABASE_URL: la suite se omite más abajo.
}

let disponible = false;
if (process.env.DATABASE_URL) {
  const sondeo = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 3000,
  });
  try {
    await sondeo.query("SELECT 1");
    disponible = true;
  } catch (error) {
    console.warn(
      `\n⚠ Suite Postgres OMITIDA — la BD no responde: ${(error as Error).message}\n`,
    );
  } finally {
    await sondeo.end();
  }
} else {
  console.warn("\n⚠ Suite Postgres OMITIDA — falta DATABASE_URL en .env.local\n");
}

const catalogo: CatalogoRepositorio = repositorioPostgres;

describe.skipIf(!disponible)(
  "repositorio Postgres (espejo de la suite demo)",
  () => {
    // ===== INICIO DE LA COPIA =====
    // Copiar aquí, SIN MODIFICAR, las líneas 20-307 de
    // `tests/unit/catalogo.test.ts` (todos sus describe/it y cuerpos).
    // Los identificadores que usan (`catalogo`, `describe`, `expect`, `it`,
    // `FamiliaOlfativa`, `OrdenCatalogo`) ya están importados arriba.
    //
    // EXCEPCIÓN 1 (única aserción adaptada): sustituir el it
    // «sin orden devuelve el orden del dato; un valor desconocido, idem»
    // por este:
    //
    //   it("sin orden devuelve un orden estable; un valor desconocido, idem", async () => {
    //     const sinOrden = (await catalogo.listarProductos()).map(
    //       (producto) => producto.slug,
    //     );
    //     const otraVez = (await catalogo.listarProductos()).map(
    //       (producto) => producto.slug,
    //     );
    //     expect(otraVez).toEqual(sinOrden);
    //
    //     const desconocido = (
    //       await catalogo.listarProductos({
    //         orden: "inventado" as OrdenCatalogo,
    //       })
    //     ).map((producto) => producto.slug);
    //     expect(desconocido).toEqual(sinOrden);
    //   });
    //
    // EXCEPCIÓN 2: nada. Los comentarios `// 25 USD` / `// 89 USD` ya
    // llegan corregidos desde la T5.
    // ===== FIN DE LA COPIA =====
  },
);
```

**Pasos:**

1. Crear la carpeta `tests/integracion/` con el archivo anterior.
2. Abrir `tests/unit/catalogo.test.ts`, copiar de la línea 20 a la 307 e incrustar dentro del `describe.skipIf`, aplicando la Excepción 1 (el `it` de «orden del dato» se reemplaza por el de «estabilidad» incluido arriba).
3. Comprobar que el archivo tiene **24 `it`** (el patrón ancla al inicio de línea para no contar el `it(` que aparece comentado en la propia cabecera):

   ```powershell
   (Select-String -Path "tests/integracion/*.test.ts" -Pattern '^\s*it\(').Count   # → 24
   ```

**Verificación:** con la BD arriba:

```powershell
npx vitest run
# → Test Files 2 passed (2) · Tests 48 passed (48) · exit 0
```

(Sin BD: `Tests 24 passed | 24 skipped` + los avisos ⚠ + exit 0 — también válido, pero la verificación oficial de la T13 se hace CON la BD arriba: 48/48.)

**→ Commit C6:** `vitest.config.ts`, `tests/integracion/catalogo-postgres.test.ts`.
Mensaje: `F3-A: suite espejo de 24 tests contra PostgreSQL`

### T12 · Documentación coherente con lo construido

**1. `docs/decisiones.md`**

- Fila **D1** (última celda), añadir al final:
  `**✅ Instalación ejecutada el 27/10/2026** (winget + UAC aprobados por el cliente; BD «peache» creada).`
- Fila **D5**, añadir al final:
  `**✅ Ejecutado en F3-A (27/10/2026):** \`data/productos.ts\` y la semilla Postgres usan la tabla USD aprobada (spec F3-A §4); \`Moneda = "USD"\`.`
- Fila **D8**, añadir al final:
  `**+ F3-A (27/10/2026):** 5.ª suite — espejo Postgres en \`tests/integracion/\` (24 tests).`
- Nueva sección al final del archivo:

```markdown
## F3-A — Catálogo en PostgreSQL (27/10/2026)

| ID | Decisión |
|---|---|
| **D-F3A-DEPS** | Instalaciones **aprobadas por el cliente** el 27/10/2026: PostgreSQL local vía `winget` + UAC (Docker descartado: no estaba instalado y la sesión no era administradora) y **`tsx`** como dependencia de desarrollo para ejecutar `db/seed.ts`. |
| **D-F3A-FILTRO** | Filtros y orden viven en **`lib/catalogo/filtro.ts`**, compartido por los dos repositorios. En Postgres, SQL sólo selecciona filas visibles (`NOT oculto`) y busca por `slug`; el filtrado — incluido `nombre-asc` con `localeCompare("es")` — se hace en memoria **para garantizar paridad exacta demo⇄Postgres sin atarse a la colación del clúster**. Migrará a SQL cuando llegue la paginación (F3-C+). |
| **D-F3A-ESPEJO** | La suite espejo adapta UNA aserción de las 24: «primer elemento = primero del archivo de datos» → **estabilidad entre consultas** (una tabla no tiene orden de archivo garantizado). La suite demo queda intacta. Sin BD, la espejo se salta con **aviso visible** (spec §8: omitir, nunca fingir). |
| **D-F3A-COMENTARIOS** | En `tests/unit/catalogo.test.ts` sólo se actualizaron **dos comentarios** (`1350 CUP`→`25 USD`, `4500 CUP`→`89 USD`); ninguna aserción se tocó (spec §8). |
| **D-F3A-DOCS** | Drive-by justificado al actualizar los árboles de `arquitectura.md`: listaban `lib/dinero.ts`, que **nunca existió** (D-DINERO-1 ya lo vetó). Al añadir `db/` y `filtro.ts` a esos árboles se corrige también esa línea. |
| **D-F3A-ESQUEMA** | `db/schema.ts` se ajustó al API real de las versiones instaladas (autorización del paso T4.2): `sql` se importa de `drizzle-orm` (no de `pg-core`) y `slug` usa `uniqueIndex()` en el callback de tabla, porque `.unique()` de columna genera `CONSTRAINT ... UNIQUE` y T4.2 exige `CREATE UNIQUE INDEX`. El bloque de código de T4 en el plan es inexecutable tal cual; la fuente de verdad es `db/schema.ts`. |
| **D-F3A-SEC-DEPS** | `npm audit` (27/10/2026): 4 *moderate* de `esbuild ≤0.24.2` — transitivo de `drizzle-kit` (dev-only), advisory GHSA-67mh-4wv8-2f99 (servidor de desarrollo de esbuild, no utilizado aquí); `npm audit --omit=dev` → **0 vulnerabilidades**. **Aceptado**: no hay fix sin degradar `drizzle-kit` a 0.18.1; prohibido `npm audit fix --force`. `npm audit signatures` falló por red (informativo, compensado por `resolved` oficial + `integrity` sha512). |
```

**2. `docs/arquitectura.md`** (sustituciones puntuales, localizables con los fragments dados):

| Localizar (grep) | Reemplazar por |
|---|---|
| `export type Moneda = "CUP";` | `export type Moneda = "USD";` |
| `moneda: "CUP",` | `moneda: "USD",` |
| ``Moneda: **CUP**, símbolo `$`, código visible en pantalla: salida **`$2,500 CUP`**.`` | ``Moneda: **USD**, símbolo `US$`, código visible en pantalla: salida **`US$47.00`** (D5).`` |
| `moneda: Moneda = "CUP"` | `moneda: Moneda = "USD"` |
| `// formatearPrecio(2500)      -> "$2,500 CUP"` | `// formatearPrecio(47)        -> "US$47.00"` |
| `// formatearPrecio(2499.5)    -> "$2,499.50 CUP"` | `// formatearPrecio(12.5)      -> "US$12.50"` |
| el `> **Aviso:**` que dice «La moneda/tarifa real (CUP vs MLC…) es una decisión pendiente» | `> **Aviso (27/10/2026):** la moneda base es **USD** (D5); la tasa CUP por 1 USD la fija el administrador (F3-C). El dinero se pinta sólo con components/ui/Precio (D-DINERO-1).` |
| fila `| D5 | **Moneda y política de precios** | …` en §12 | en la celda de «resolución» empezar por `**Resuelta 27/10/2026:** moneda base USD; tasa CUP/USD en F3-C. Quedan sólo redondeos/impuestos.` |

Además, en los **árboles de estructura** (grep `dinero.ts` y el árbol de `lib/`):

- Borrar la línea de `│   └── dinero.ts                 # formatearPrecio() …` (nunca existió).
- Añadir al árbol de `lib/catalogo/`: `filtro.ts` («filtros/orden compartidos demo⇄Postgres») y `repositorio-postgres.ts` («implementación PostgreSQL»).
- Añadir a la estructura raíz: `db/` (`schema.ts`, `seed.ts`, `migraciones/`), `drizzle.config.ts`, `.env.local` («gitignored: DATABASE_URL, FUENTE_CATALOGO»).
- Regla de `data/**` (grep `@/data` en la sección 6.4): la única puerta a `data/` sigue siendo el repositorio demo, **más `db/seed.ts` como script de desarrollo** — la UI jamás importa `data/` (eso no cambia).

**3. `eslint.config.mjs`** — comentario de la regla `no-restricted-imports` (línea ~23): cambiar «`data/**` es exclusivo del repositorio en demo» por «`data/**` es exclusivo del repositorio en demo y de `db/seed.ts` (script de desarrollo)». **La regla no se toca** (sigue sin permitir `@/data/*` en `app/` ni `components/`).

**4. `lib/catalogo/repositorio-demo.ts`** — cabecera (líneas 6-7): `// ÚNICA puerta hacia data/` → `// Puerta de la app hacia data/ (junto con db/seed.ts, script de desarrollo; la UI nunca importa data/).`

**5. `docs/api-contracto.md`**

- `replaceAll` `"moneda": "CUP"` → `"moneda": "USD"` (5 coincidencias).
- Grep `"precio":` → los ejemplos numéricos pasan a los valores USD de la tabla de T5 (p. ej. `2500` → `47`, `1890` → `35`); no hace falta conservar el valor exacto del ejemplo, sí la coherencia con la moneda.
- Fila de checklist de la línea ~599: «la unidad «CUP» accesible aparte» → «la unidad «USD» accesible aparte».

**6. `docs/design/componentes.md` §10** (sólo los ejemplos y la decisión del PM; la mecánica del componente no cambia):

| Localizar (grep) | Reemplazar por |
|---|---|
| ``Ejemplo con `CUP`: **`$1,250.00`**`` | ``Ejemplo con `USD`: **`US$47.00`**`` |
| `<data value="1250.00">$1,250.00</data><span class="sr-only"> CUP</span>` | `<data value="47.00">US$47.00</data><span class="sr-only"> USD</span>` |
| «Decisión para el PM: moneda por defecto de la tienda = `CUP` (supuesto de Fase 2…» | «**Resuelta (D5, 27/10/2026): moneda base = USD.** El conmutador USD ⇄ CUP y la tasa CUP por 1 USD son F3-C.» |

**7. `AGENTS.md` — sección «Stack técnico»** (el propio archivo pide documentarlo al elegirlo; no tocar el bloque `nextjs-agent-rules`):

```markdown
## Stack técnico

- **Frontend:** Next.js 16 (App Router, Server Components) + React 19 + TypeScript.
- **Datos:** PostgreSQL local (versión instalada el 27/10/2026 en T1: 17 o 18, escribir la real) + Drizzle ORM. Esquema/migraciones en `db/`, semilla `npm run db:seed`. Fuente conmutable `FUENTE_CATALOGO=demo|postgres` (defecto `demo`) — spec `docs/specs/2026-10-27-f3a-postgres-drizzle-design.md`.
- **Tests:** Vitest (unit + espejo de BD) y Playwright + axe-core (E2E/accesibilidad): 5 suites.
- **Moneda base:** USD (decisión D5); conversión a CUP → F3-C.
```

**Verificación T12:** `Select-String -Path "docs\*.md","docs\design\*.md","data\README.md" -Pattern "CUP"` → sólo restos legítimos: historias (HU-08/51/52), decisiones como registro histórico (D5, D-DINERO-1, la nueva D-F3A-*), el spec (que documenta el paso a USD) y las menciones a la **tasa CUP/USD** futura (F3-C); `npm run lint` → 0.

**→ Commit C7:** todos los docs de T12.
Mensaje: `F3-A: documentación coherente con USD, Postgres y las nuevas suites`

### T13 · Puerta de verificación final (obligatoria, spec §9)

**Prerrequisitos (comprobarlos ANTES de los gates):**

```powershell
Get-Service *postgres* | Select-Object Name, Status   # → Running
git status --porcelain                                 # → vacío (docs ya en C7)
npm run db:seed                                        # si la BD estuviera vacía
```

**Los 5 comandos, en orden, con salida literal capturada:**

```powershell
npm run typecheck      # exit 0
npm run lint           # exit 0
npx vitest run         # exit 0 → 48/48 (24 demo + 24 espejo Postgres)
npx playwright test    # exit 0 → 19/19 (10 de accesibilidad incluidas)
npm run build          # exit 0
```

**Evidencia adicional (específica de F3-A), también literal:**

```powershell
# Idempotencia de la semilla: ejecutar dos veces y contar
npm run db:seed
npm run db:seed
& $psql -U postgres -d peache -c "SELECT count(*) FROM productos;"   # → 14 (nunca 28); $psql del paso T1.3 — re-definir si es otra sesión

# La moneda se pinta como decide Intl (D-DINERO-1), no a mano
node -e "console.log(new Intl.NumberFormat('es-CU',{style:'currency',currency:'USD'}).format(47))"
# → US$47.00

git log --oneline     # → C1..C7 visibles sobre los 3 previos
```

**Si algo falla:** el fallo es un bug de la app (spec §8) — se diagnostica y se corrige en código/configuración, se re-ejecutan **los 5 gates completos** y sólo entonces se committea el arreglo. Ningún test se desactiva, ninguna suite se salta «para que pase».

**Criterio de terminado:** los 5 gates en exit 0 con sus salidas literales + evidencia de idempotencia + árbol limpio. Eso se entrega al cliente en el resumen final.

## 4 · Riesgos conocidos y su manejo

| Riesgo | Manejo |
|---|---|
| UAC: la instalación espera clic del cliente | Paso T1.2 marcado como interacción; sin ese clic no continúa nada. |
| El id del paquete winget puede ser `.17` o `.18` | T1.1 busca primero y se instala la más alta disponible; la versión real se documenta en `AGENTS.md` (T12.7). |
| PATH sin `psql` refrescado en la sesión actual | Siempre ruta completa (`Get-ChildItem` del paso T1.3). |
| La API de `drizzle-kit`/`drizzle-orm` cambia con la versión | T4.2 **lee el SQL generado** antes de migrar; T4.4 verifica `\d productos`. Ajuste en T4, no parches después. |
| BD caída durante los gates | `npm run build` falla ruidosamente = comportamiento deseado (spec §7, sin fallback). Se arranca el servicio y se re-ejecuta. |
| `env` de vitest y aislamiento de suites | `test.env.FUENTE_CATALOGO=demo` fija la suite unit; la espejo importa el repo Postgres directamente. |
| `next dev` reescribe `tsconfig.json`/`AGENTS.md` | Comportamiento ya registrado (D-TSCONFIG, D-AGENTS): no revertir. |
| `.env.local` con la contraseña | Gitignored (ya verificado en Fase 1); el plan nunca lo commitea. |
| Colación del clúster afectando al orden | Evitada por diseño: el orden se calcula en TS con `localeCompare("es")` (D-F3A-FILTRO). |

## 5 · Explícitamente fuera de alcance de este plan

- F3-B identidad/login · F3-C catálogo CRUD, conmutador USD⇄CUP y tabla `configuracion` · F3-D pedidos · F3-E reportes y email.
- Imágenes reales de producto (HU-25), contenido legal (D7), webfonts (D10).
- Paginación, caché y filtros en SQL (F3-C+ cuando crezca el catálogo — hoy 14 productos).
- Reescribir la sección §6.3 `formatearPrecio()` de `arquitectura.md` (ya obsoleta por D-DINERO-1): sólo se actualizan sus ejemplos de moneda (T12.2).
- Servicio de email, storage de imágenes, exportación de reportes — pendientes ya abiertos en `docs/historias-usuario.md`.

## 6 · Definición de hecho

1. Los 5 gates en exit 0 con salida literal (T13).
2. Evidencia de idempotencia de la semilla (14 tras doble ejecución) y de formato USD (`US$47.00`).
3. 7 commits (C1…C7) sobre el historial existente, árbol limpio, `.env.local` jamás versionado.
4. Docs coherentes: sin «CUP» activo fuera de registros históricos/decisiones.
5. Resumen final al cliente en español: decisiones, instalaciones ejecutadas, evidencias.



