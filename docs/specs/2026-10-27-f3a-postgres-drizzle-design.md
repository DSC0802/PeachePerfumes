# Diseño F3-A — Catálogo en PostgreSQL (local → nube)

**Fecha:** 2026-10-27 · **Estado:** aprobado por el cliente
**Decisión relacionada:** `docs/decisiones.md` D1 (Postgres local → nube después), D5 (USD base), HU-23 (ocultar), HU-61 (semilla)
**Alcance:** primer bloque de la Fase 3. Siguientes bloques: F3-B identidad, F3-C catálogo+moneda, F3-D pedidos, F3-E reportes+email (`docs/historias-usuario.md`).

---

## 1 · Objetivo

Mover el catálogo de archivos TypeScript (`data/*.ts`) a **PostgreSQL local** sin que la interfaz se entere: la única puerta de datos sigue siendo `lib/catalogo`. Criterio de éxito: los 5 gates en exit 0 (typecheck, lint, vitest, playwright, build) y la tienda funcionando igual que hoy, ahora leyendo la BD.

**Entra en F3-A:** instalación de PostgreSQL local + Drizzle ORM · esquema · migraciones · semilla de 14 productos en USD · repositorio Postgres bajo `lib/catalogo` · conmutador demo⇄postgres · gates en verde.

**No entra:** UI nueva, dashboard, login, pedidos, conmutador de moneda CUP/USD (F3-C), servicio de email (F3-E).

## 2 · Dependencias a instalar (permiso explícito del cliente)

| Qué | Paquete | Cuándo |
|---|---|---|
| Servidor de BD | PostgreSQL local (instalador nativo o Docker — se preguntará al cliente cuál prefiere) | al iniciar la implementación |
| Runtime | `drizzle-orm`, `pg` | al iniciar la implementación |
| Desarrollo | `drizzle-kit`, `@types/pg` | al iniciar la implementación |

Ninguna instalación ocurre antes de este diseño aprobado (`AGENTS.md`).

## 3 · Esquema

### `productos`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | generado por la BD |
| `slug` | text UNIQUE NOT NULL | URL de `/producto/[slug]` |
| `marca`, `nombre`, `tamano` | text NOT NULL | espejo del contrato `Producto` |
| `tamano_ml` | integer NOT NULL | |
| `precio_usd` | numeric(10,2) NOT NULL | **moneda base (D5)** — se pintará vía componente `Precio` |
| `descripcion` | text NOT NULL | |
| `notas_salida`, `notas_corazon`, `notas_fondo` | text[] NOT NULL | pirámide olfativa |
| `imagen_src`, `imagen_alt` | text NOT NULL | hoy rutas `/productos/*.webp` inexistentes (placeholder) |
| `categoria_id` | text FK → `categorias.id` | |
| `familia` | enum `familia_olfativa` | 7 valores: citrico, floral, amaderado, oriental, frutal, acuatico, gourmand |
| `destacado`, `novedad` | boolean NOT NULL DEFAULT false | landing / etiqueta «Nuevo» |
| `estado` | enum `estado_producto` NOT NULL DEFAULT 'activo' | **activo · agotado · descontinuado** (HU-24) |
| `oculto` | boolean NOT NULL DEFAULT false | **HU-23: ocultar, sin borrado físico** (decidido 2026-10-27) |
| `creado_en`, `actualizado_en` | timestamptz | auditoría mínima |

`estado` y `oculto` se crean **desde el inicio** aunque F3-A no los use en UI: evitan una migración destructiva de la tabla cuando F3-C abra el CRUD del dashboard. La semilla deja todo `activo` y `oculto = false`.

### `categorias`

`id` text PK («mujer», «hombre», «unisex») · `slug` text UNIQUE · `nombre` text · `descripcion` text — 3 filas, espejo de `data/categorias.ts`.

### `configuracion`

Tabla clave-valor (`clave` text PK, `valor` text, `actualizado_en`, `actualizado_por`) para la tasa **CUP por 1 USD** (HU-52). **Se crea en F3-C**, no aquí: en F3-A no existe conversión que configurar (valor inicial propuesto allí: 120).

### Índices

`productos(categoria_id)`, `productos(familia)`, `productos(estado)` WHERE NOT oculto, UNIQUE(slug).

## 4 · Semilla (HU-61) — precios USD aprobados por el cliente

Escala conservada respecto a los precios CUP actuales, acabado de tienda, rango $25–$89:

| Slug | CUP hoy | **USD** | | Slug | CUP hoy | **USD** |
|---|---|---|---|---|---|---|
| rosa-de-batey | 1350 | **25** | | azahar-de-luna | 2650 | **49** |
| manglar | 1450 | **27** | | alba | 2980 | **55** |
| cafe-de-siesta | 1690 | **32** | | vainilla-de-playa | 3200 | **59** |
| sandia-de-verano | 1780 | **34** | | cedro-nocturno | 3900 | **69** |
| rio-cristal | 1890 | **35** | | amber-real | 4200 | **79** |
| sal-y-coral | 2150 | **39** | | ebano | 4500 | **89** |
| duna | 2350 | **44** | | brisa-de-coco-100 | 2500 | **47** |

Mismos 14 slugs, mismos `destacado`/`novedad`, mismas categorías y familias que hoy. El script de semilla es idempotente (re-ejecutable sin duplicar).

## 5 · Cambio de moneda base (consecuencia de D5)

- `Moneda` pasa de `"CUP"` a `"USD"` en `lib/catalogo/tipos.ts`.
- `components/ui/Precio` (único punto que pinta dinero, D-DINERO-1) formatea USD.
- El conmutador USD⇄CUP y la tasa configurable por el administrador **son F3-C**; en F3-A sólo existe la base USD.

## 6 · Conmutación demo ⇄ Postgres

```ts
// lib/catalogo/index.ts — único punto de entrada de app/ y components/
export const catalogo: CatalogoRepositorio =
  process.env.FUENTE_CATALOGO === "postgres" ? repositorioPostgres : repositorioDemo;
```

- `.env.local` (gitignored, ya cubierto) lleva `FUENTE_CATALOGO=postgres` y `DATABASE_URL=…`.
- Por defecto `demo`: quien no configure nada sigue funcionando como hoy (CI, revisores).
- El repositorio Postgres implementa **la misma interfaz** `CatalogoRepositorio` (5 métodos), devuelve tipos de dominio y `null`/`[]` según el contrato — jamás `Row` de BD.
- Mismos filtros, búsqueda y los 5 `OrdenCatalogo` incluido `nombre-asc` con `localeCompare("es")`.

## 7 · Errores y estados

- Si la BD no responde, el repositorio **lanza**; cada ruta muestra su `error.tsx` existente con mensaje en español.
- **Sin fallback automático al demo**: caer a datos demo ante un fallo sería mostrar datos falsos al usuario.
- Se verifica que todas las rutas que leen catálogo (`/`, `/catalogo`, `/producto/[slug]`) tengan `error.tsx`.

## 8 · Estrategia de pruebas

| Suite | Contra qué | Acción |
|---|---|---|
| Unit (24, vitest) | repositorio demo | sin cambios — lógica pura |
| Unit nueva (mismo set de aserciones) | repositorio Postgres | se ejecuta sólo si hay BD conectada; si no, se omite con aviso claro (no silencioso) |
| E2E (19, playwright) | app completa contra Postgres | deben seguir 19/19; el seed reproduce los mismos datos |
| A11y (axe, dentro de los 19) | light+dark | 10/10 |

Si un test depende de un valor CUP y falla por el paso a USD: **se actualiza al precio USD y se documenta en `decisiones.md` (D5)**. Nunca se desactiva ni se maquilla un test.

**Regla dura:** ningún test se toca para «hacer pasar» el cambio; cualquier fallo revela un bug real que se corrige en el código de la app.

## 9 · Puerta de verificación (obligatoria antes de declarar terminado)

```
npm run typecheck   → exit 0
npm run lint        → exit 0
npx vitest run      → exit 0
npx playwright test → exit 0 (19/19)
npm run build       → exit 0
```

Salida literal de los 5 comandos en la devolución. Sin ella, no hay «terminado».

## 10 · Estructura resultante

```
lib/catalogo/
├── index.ts               # conmutador FUENTE_CATALOGO
├── repositorio.ts         # interfaz (sin cambios)
├── repositorio-demo.ts    # se conserva
├── repositorio-postgres.ts # NUEVO
├── tipos.ts               # Moneda → "USD"
db/
├── schema.ts              # esquema Drizzle
├── seed.ts                # semilla de 14 productos
└── migraciones/           # generadas por drizzle-kit
drizzle.config.ts
.env.local                 # FUENTE_CATALOGO, DATABASE_URL (gitignored)
data/                      # se conserva como fuente del repositorio demo
```

## 11 · Fuera de alcance / pendientes abiertos

- Conmutador de moneda y tasa CUP/USD → F3-C.
- Imágenes de producto (HU-25): pendiente de decisión (storage vs local).
- Login, CRUD de dashboard, pedidos, notificaciones, reportes, email → F3-B, F3-C, F3-D, F3-E.
- Contenido legal (D7) y webfonts (D10): pospuestos por el cliente.
