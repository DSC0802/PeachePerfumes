# Arquitectura — Peache Perfumes (Fase 0/1)

**Fecha:** 24/10/2026 · **Autor:** agente `architect` · **Estado:** propuesta para aprobación del project-manager
**Alcance de este documento:** definir la base técnica de la Fase 2 (frontend navegable con datos de demostración) y dejar la puerta abierta a un ecommerce completo, sin tomar decisiones irreversibles.

> **Método de verificación de versiones:** todas las versiones de abajo se consultaron el 24/10/2026 con `npm view <paquete> version` / `npm view <paquete> dist-tags` contra el registro público de npm. **No se instaló ninguna dependencia** y no se creó scaffolding. Donde hace falta comprobar algo en tiempo de instalación se indica expresamente.

---

## 1. Resumen de decisiones

| Área | Decisión | Reversible |
|---|---|---|
| Framework | Next.js 16 (App Router, React Server Components) | Medio |
| Lenguaje | TypeScript estricto | Sí (pero no conviene) |
| UI | React 19 + CSS Modules + tokens CSS (variables) | Sí |
| Sistema de estilos | **Sin framework CSS** (0 dependencias) | Sí (añadir Tailwind después es viable) |
| Datos Fase 2 | Import estático tras una **capa de repositorio** (frontera de abstracción) | Sí |
| Tema claro/oscuro | Script inline anti-FOUC + `data-theme` en `<html>` | Sí |
| Estilos de carpetas | Organización **por dominio** con carpeta `ui/` para primitivas | Sí |
| Paquetes | `npm` (pnpm no está instalado en el entorno) | — |
| Control de versiones | Repositorio git **no existe aún**: se propone `git init` (requiere permiso) | — |

---

## 2. Stack y versiones

### 2.1 Núcleo (imprescindibles para Fase 2)

| Paquete | Versión propuesta | Tipo | Verificación |
|---|---|---|---|
| `next` | `16.4.3` | dependencia | `latest` en npm el 24/10/2026 |
| `react` | `19.3.1` | dependencia | `latest` |
| `react-dom` | `19.3.1` | dependencia | `latest` |
| `typescript` | `5.9.3` | devDependency | última 5.x estable; **no** usar `7.0.2` (ver nota) |
| `@types/node` | `22.20.5` | devDependency | alineado al Node 22 del entorno |
| `@types/react` | `19.3.0` | devDependency | — |
| `@types/react-dom` | `19.3.0` | devDependency | — |
| `eslint` | `10.13.0` | devDependency | `latest`; requisito de `eslint-config-next` (`>=9`) |
| `eslint-config-next` | `16.4.3` | devDependency | misma versión que `next` |

Restricciones verificadas del entorno frente a estas versiones:

- `next@16.4.3` exige **Node ≥ 20.9.0** → el entorno tiene **v22.21.1** ✅
- `next@16.4.3` exige **TypeScript ≥ 5.1.0** → se propone 5.9.3 ✅
- `react@19.3.1` cumple el `peerDependencies` de `next@16.4.3` (`^19.0.0`) ✅
- `npm` 10.9.4 es el gestor (pnpm **no** está instalado; no se instala nada sin aprobación).

**Nota sobre TypeScript:** npm marca `typescript@latest = 7.0.2`, que es una reescritura mayor (nativo). Next 16 sólo documenta "TypeScript 5+". Para una base nueva se fija **`5.9.3`** por estabilidad del ecosistema (`eslint-config-next`, tipos de React). *Al instalar, confirmar con `npm view typescript@5 version` que 5.9.3 sigue siendo la última 5.x; si al construir aparece un error de compatibilidad, subir a la última 5.x compatible y dejarlo registrado en este documento.*

### 2.2 Justificación de elecciones concretas

- **App Router (no Pages Router):** App Router es el único camino con soporte activo; permite Server Components por defecto (HTML ya renderizado → mejor LCP, menos JS), `generateStaticParams` para el catálogo y una ruta natural hacia Server Actions / Route Handlers en fases futuras.
- **Turbopack (bundler por defecto en Next 16):** sin configuración; builds 2–5× más rápidos y Fast Refresh hasta 10×. No se usa `--webpack`.
- **No se habilita `cacheComponents` ni PPR en Fase 2:** en Next 16 todo lo dinámico es opt-in; habilitarlo ahora obligaría a gestionar `"use cache"` y `cacheLife` sin necesidad. Se documenta como opción cuando entre la API real.
- **`middleware.ts` → `proxy.ts` en Next 16:** se deja **sin crear**. No hay necesidad de interceptar red en Fase 2. Si más adelante se necesita (p. ej. proteger `/admin`), el archivo se llama `proxy.ts` y corre en runtime Node.
- **CSS Modules + tokens CSS en vez de Tailwind:** el agente `design` está entregando un sistema de diseño con tokens; las variables CSS son el formato neutro que cualquier tooling consume. 0 dependencias extra = 0 aprobaciones extra, control total del contraste (accesibilidad) y de los dos temas. Tailwind queda como alternativa registrada en «Decisiones pendientes».
- **Sin `next-themes`:** el script de tema son ~12 líneas (sección 7). Una dependencia de terceros para eso no compensa.
- **Scaffolding manual, no `create-next-app`:** verificado con `npx create-next-app@16.4.3 --help` que **por defecto incluye `--agents-md`** (riesgo de sobrescribir el `AGENTS.md` existente de este workspace), `--tailwind` y `--disable-git` opcional. Además `--tailwind` es la opción por defecto. Por eso la Fase 2 se arranca creando los archivos de configuración a mano con versiones fijadas (sección 4).

### 2.3 Dependencias: imprescindibles vs. pendientes de aprobación

**Grupo A — imprescindibles para la Fase 2 (todas requieren aprobación de instalación según `AGENTS.md`):**

```json
"dependencies": {
  "next": "16.4.3",
  "react": "19.3.1",
  "react-dom": "19.3.1"
},
"devDependencies": {
  "@types/node": "22.20.5",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  "eslint": "10.13.0",
  "eslint-config-next": "16.4.3",
  "typescript": "5.9.3"
}
```

**Grupo B — pendientes de aprobación antes de instalar (NO instalar en Fase 2):**

| Paquete | Versión consultada | Para qué | Cuándo abordarlo |
|---|---|---|---|
| `vitest` | `5.0.5` | tests unitarios del repositorio y helpers | Fase 3, cuando haya lógica que romper |
| `@playwright/test` | `1.64.1` | tests E2E de catálogo/carrito/checkout | Fase 4 (checkout real) |
| `zod` | `4.6.7` | validar respuestas de la API futura en la frontera de datos | Cuando exista API |
| `tailwindcss` + `@tailwindcss/postcss` | `4.3.3` | utility classes si el `design` lo pide | Solo si `design` lo justifica |
| `babel-plugin-react-compiler` | por confirmar al instalar | memoización automática (`reactCompiler: true`) | Cuando haya problemas de re-render medidos |
| `@axe-core/playwright` | por confirmar al instalar | auditoría a11y automatizada | Fase 3 |
| `next-themes` | por confirmar al instalar | alternativa madura al script de tema propio | Solo si el script propio falla en QA |

**Recursos que NO son dependencias npm pero también requieren aprobación:** descarga de tipografías WOFF2 (licencia + red en build), imágenes de producto reales, cualquier `npm install` de paquete no listado.

---

## 3. Estructura de carpetas

Árbol completo de la Fase 2, comentado. `docs/design/` lo genera el agente `design` y **no se toca**.

```
PeachePerfumes/
├── AGENTS.md                     # instrucciones del proyecto (NO modificar)
├── package.json                  # scripts + dependencias fijadas (sección 2.3)
├── package-lock.json             # generado por npm install (aprobar antes de crear)
├── tsconfig.json                 # strict: true, alias "@//*" -> "./*"
├── next.config.ts                # config mínima; sin remotePatterns en Fase 2
├── eslint.config.mjs             # ESLint flat config nativo de Next 16
├── .gitignore                    # .next/, node_modules/, .env*
├── .env.local.example            # documenta variables FUTURAS (sin secretos)
│
├── app/                          # App Router: rutas = carpetas
│   ├── layout.tsx                # raíz: <html lang="es">, script anti-FOUC, <Header/>, <Footer/>
│   ├── globals.css               # reset, tokens (claro/oscuro), tipografía base, utilidades
│   ├── page.tsx                  # /  -> landing (Server Component)
│   ├── not-found.tsx             # 404 global (se usa en /producto/[slug] inexistente)
│   ├── fonts/                    # *.woff2 para next/font/local (fuentes locales, sin red)
│   ├── catalogo/
│   │   └── page.tsx              # /catalogo -> lee searchParams (categoria, orden, q)
│   └── producto/
│       ├── page.tsx              # /producto -> redirect('/catalogo') (evita 404 por tecleo directo)
│       └── [slug]/
│           └── page.tsx          # /producto/[slug] -> generateStaticParams + ficha
│
├── components/                   # ORGANIZACIÓN POR DOMINIO (ver justificación abajo)
│   ├── layout/                   # piezas transversales de la página
│   │   ├── Cabecera.tsx          # logo, navegación, conmutador de tema
│   │   ├── Pie.tsx
│   │   ├── Navegacion.tsx        # enlaces de Fase 2 (sin enlaces a rutas inexistentes)
│   │   └── Cabecera.module.css
│   ├── theme/
│   │   └── ConmutadorTema.tsx    # único "use client" del tema (ver sección 7)
│   ├── catalogo/                 # dominio catálogo
│   │   ├── TarjetaProducto.tsx   # card reutilizable (también en landing)
│   │   ├── ListadoProductos.tsx  # grid + estado vacío
│   │   ├── BarraFiltros.tsx      # categorías y orden (enlaces + searchParams)
│   │   ├── EstadoVacio.tsx
│   │   └── *.module.css
│   ├── producto/                 # dominio ficha de producto
│   │   ├── FichaProducto.tsx
│   │   ├── NotasOlfativas.tsx    # salida / corazón / fondo
│   │   ├── ProductosRelacionados.tsx
│   │   └── *.module.css
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── SeccionDestacados.tsx # reutiliza TarjetaProducto
│   │   └── *.module.css
│   └── ui/                       # primitivas SIN lógica de negocio
│       ├── Boton.tsx             # variantes: primario, secundario, fantasma
│       ├── Contenedor.tsx        # ancho máximo + padding responsive
│       ├── TituloSeccion.tsx
│       ├── Etiqueta.tsx          # badge: "Nuevo", "Destacado"
│       └── *.module.css
│
├── lib/                          # LÓGICA (sin JSX)
│   ├── catalogo/                 # >>> FRONTERA DE ABSTRACCIÓN DE DATOS (sección 6)
│   │   ├── tipos.ts              # Producto, Categoria, ProductoFiltro, Moneda
│   │   ├── repositorio.ts        # interface CatalogoRepositorio
│   │   ├── repositorio-demo.ts   # implementación Fase 2 (importa de ../../data)
│   │   └── index.ts              # ÚNICO punto de entrada exportado al exterior
│   └── dinero.ts                 # formatearPrecio() -> "$2,500 CUP"
│
├── data/                         # ⚠️ DATOS DE DEMOSTRACIÓN FICTICIOS
│   ├── productos.ts              # ~12 productos de ejemplo
│   ├── categorias.ts             # categorías de ejemplo
│   └── README.md                 # aviso: "datos de demostración, no reales"
│
├── public/
│   ├── productos/                # imágenes demo locales (svg/webp) -> rutas limpias
│   └── favicon.ico
│
├── docs/
│   ├── arquitectura.md           # este archivo
│   ├── api-contracto.md          # contrato de la API futura
│   └── design/                   # agente design — NO TOCAR
│
├── tests/                        # reservado (vacío en Fase 2; ver sección 10)
│   └── README.md                 # qué se testará y con qué herramienta
│
└── .next/                        # generado por Next (ignorado)
```

**Justificación de la organización de `components/`:** por **dominio** (`catalogo/`, `producto/`, `landing/`, `layout/`) más una carpeta `ui/` para primitivas sin negocio. Un ecommerce crece por dominios (después llegan `carrito/`, `checkout/`, `cuenta/`, `admin/`): al organizarse por tipo (`components/Button`, `components/Header`…), el día que entre el carrito la mitad de los archivos se tendría que reubicar. Con dominio, cada nueva fase añade una carpeta y no mueve nada. `ui/` existe porque `Boton`, `Contenedor` o `Etiqueta` se usan en varios dominios y no pertenecen a ninguno.

**Justificación de `app/globals.css` en vez de `styles/`:** los tokens son globales por definición y se importan una sola vez en `layout.tsx`. Los estilos de cada componente viven en su `Componente.module.css` (co-locación: quien edita el componente ve sus estilos). Crear `styles/` añadiría una tercera ubicación que hay que recordar.

---

## 4. Configuración concreta (para el agente `frontend`)

### 4.1 `package.json` — scripts

```json
{
  "name": "peache-perfumes",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

> `next lint` **fue eliminado en Next 16** (verificado en el changelog de Next.js 16): `next build` ya no ejecuta lint. El lint se lanza con ESLint directamente.

### 4.2 `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imágenes locales en Fase 2: no se habilita ningún dominio remoto.
  // Nota Next 16: usar rutas limpias (/productos/foo.webp), sin query strings,
  // porque locales con query exigen images.localPatterns.
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
```

No se activa `cacheComponents`, `reactCompiler` ni `turbopack` (Turbopack ya es el bundler por defecto de `next dev`/`next build` en Next 16).

### 4.3 `tsconfig.json` — claves obligatorias

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`strict: true` es requisito arquitectónico: la frontera de datos (sección 6) sólo protege si los tipos no se pueden silenciar con `any`.

### 4.4 `eslint.config.mjs` (flat config, verificado contra la plantilla oficial de `create-next-app@16.4.3`)

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // Refuerzo de la frontera de abstracción: nada fuera de lib/catalogo
    // puede leer datos de demostración directamente.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/data/*", "../**/data/*", "../../**/data/*"],
              message:
                "Los datos de demostración sólo se acceden desde lib/catalogo. Usa 'import { ... } from \"@/lib/catalogo\"'.",
            },
          ],
        },
      ],
    },
  },
]);
```

---

## 5. Mapa de rutas

### 5.1 Fase 2 (implementar ahora)

| Ruta | Archivo | Render | Contenido |
|---|---|---|---|
| `/` | `app/page.tsx` | Server, estático | Landing: hero, destacados, novedades, familias/categorías |
| `/catalogo` | `app/catalogo/page.tsx` | Server, `searchParams` | Listado completo, filtros por `?categoria=` y `?orden=`, búsqueda `?q=` |
| `/producto/[slug]` | `app/producto/[slug]/page.tsx` | Server + `generateStaticParams` | Ficha: imagen, precio, notas (salida/corazón/fondo), categoría, relacionados |
| `/producto` | `app/producto/page.tsx` | Server | `redirect("/catalogo")` |
| `404` | `app/not-found.tsx` | Server | Página de no encontrado con enlace a catálogo |

Reglas de enrutado Fase 2:

- **No se crean enlaces a rutas que no existen.** La cabecera sólo muestra *Inicio* y *Catálogo*. `Carrito` y `Cuenta` no aparecen hasta que tengan ruta (evita enlaces muertos, que son un fallo de accesibilidad y de confianza).
- `searchParams` en Next 16 es `Promise` → `const { categoria, orden, q } = await searchParams;` (igual que `params`).
- `/producto/[slug]` inexistente → `notFound()` dentro de `generateStaticParams`/página → renderiza `not-found.tsx` con HTTP 404.
- Categorías y orden se codifican en la URL (no en estado de React): la URL es la fuente de verdad, así el catálogo es enlazable, compartible y funciona sin JavaScript.

### 5.2 Escalado a fases futuras (no se implementan)

| Ruta | Cuándo | Nota de arquitectura |
|---|---|---|
| `/carrito` | Fase 3 | Página mayoritariamente cliente; consume `GET/PATCH /api/v1/carrito/*` |
| `/checkout`, `/checkout/confirmacion/[id]` | Fase 4 | Stepper; requiere decisiones de pagos/moneda (sección 12) |
| `/cuenta`, `/cuenta/pedidos`, `/cuenta/pedidos/[id]` | Fase 5 | Requiere decisión de autenticación |
| `/admin`, `/admin/productos`, `/admin/productos/[id]` | Fase 6 | Se protege con `proxy.ts` (Next 16) cuando exista auth |
| `/api/v1/**` (Route Handlers) | Fase 3+ | Implementa `docs/api-contracto.md`; misma forma de datos que la capa `lib/catalogo` |
| `/nosotros`, `/contacto`, `/preguntas-frecuentes` | Cuando `design`/cliente lo pidan | Estáticas, sin datos |

Las rutas futuras **no requieren mover** las de Fase 2: añaden carpetas bajo `app/` y componentes bajo `components/<dominio>/`.

---

## 6. Datos de demostración y estrategia de datos

> ⚠️ **Origen de los datos de Fase 2: DEMOSTRACIÓN FICTICIA.** Productos, marcas, precios, categorías e imágenes de `data/` son inventados con fines visuales. **No usar marcas reales de perfumería** (riesgo de marca) ni precios reales. La interfaz debe mostrar un aviso visible: *«Productos de demostración»*. Todo esto se sustituirá por datos reales en la fase de catálogo con backend.

### 6.1 Tipos TypeScript (contrato de dominio)

Archivo: `lib/catalogo/tipos.ts`

```ts
/**
 * DATOS DE DEMOSTRACIÓN: este tipo es el contrato estable del dominio.
 * Se mantiene idéntico cuando se pase a API real (ver docs/api-contracto.md).
 */
export type Moneda = "CUP";

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
  /** Precio en unidades de la moneda, sin símbolo. Ej: 2500. Decimales permitidos. */
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
}

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
```

### 6.2 Ejemplo de objeto (demo)

```ts
export const ejemploProducto: Producto = {
  id: "p001",
  slug: "brisa-de-coco-100",
  marca: "Casa Palma",
  nombre: "Brisa de Coco",
  tamano: "100 ml",
  tamanoMl: 100,
  precio: 2500,
  moneda: "CUP",
  descripcion:
    "Fresca, luminosa y ligera: una salida cítrica que se asienta sobre un corazón floral y un fondo cremoso de coco y sándalo. De demostración.",
  notas: {
    salida: ["Bergamota", "Limón verde"],
    corazon: ["Jazmín", "Flor de azahar"],
    fondo: ["Coco", "Sándalo", "Almizcle blanco"],
  },
  imagen: {
    src: "/productos/brisa-de-coco.webp",
    alt: "Frasco de Brisa de Coco de 100 ml sobre fondo arena",
  },
  categoriaId: "mujer",
  destacado: true,
  novedad: false,
};
```

Categorías de demo: `mujer`, `hombre`, `unisex`. Cambiar esta taxonomía en el futuro sólo toca `data/categorias.ts` y `Producto.categoriaId` (el tipo `Categoria` no cambia).

### 6.3 Formato de dinero para Cuba (de demostración)

- Moneda: **CUP**, símbolo `$`, código visible en pantalla: salida **`$2,500 CUP`**.
- Formato en `lib/dinero.ts`, usando `Intl.NumberFormat` (verificado en Node 22 del entorno: `Intl.NumberFormat("es-CU")` agrupa con `,` → `2,500`):

```ts
import type { Moneda } from "@/lib/catalogo/tipos";

const formateadores = new Map<Moneda, Intl.NumberFormat>();

export function formatearPrecio(precio: number, moneda: Moneda = "CUP"): string {
  let f = formateadores.get(moneda);
  if (!f) {
    f = new Intl.NumberFormat("es-CU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formateadores.set(moneda, f);
  }
  return `$${f.format(precio)} ${moneda}`;
}
// formatearPrecio(2500)      -> "$2,500 CUP"
// formatearPrecio(2499.5)    -> "$2,499.50 CUP"
```

> **Aviso:** el importe es de demostración. La moneda/tarifa real (CUP vs MLC, redondeos, IVA) es una **decisión pendiente** (sección 12). El código admite nuevas `Moneda` añadiendo una literal al type, sin tocar la UI.

### 6.4 Estrategia de datos Fase 2 y frontera de abstracción

**Hoy:** import estático + Server Components. Los productos se importan en el servidor, se renderizan a HTML en `next build` (rutas estáticas) y **no hay `fetch` ni estado de carga en el cliente**.

**El mañana:** una API HTTP que devuelva los mismos tipos. La UI **no se reescribe**: sólo se cambia la implementación del repositorio.

#### La frontera: `lib/catalogo/`

```ts
// lib/catalogo/repositorio.ts
import type { Categoria, Producto, ProductoFiltro } from "./tipos";

/**
 * Interfaz estable de acceso a datos.
 * - Es ASYNC aunque hoy los datos sean locales: el día que haya red/API,
 *   las firmas no cambian (la UI ya hace `await`).
 * - Devuelve tipos de dominio, jamás `Response`, `Row` de BD ni JSON crudo.
 */
export interface CatalogoRepositorio {
  /** Listado con filtros. Devuelve [] si no hay resultados (no lanza). */
  listarProductos(filtro?: ProductoFiltro): Promise<Producto[]>;
  /** Ficha por slug. Devuelve null si no existe (la página decide notFound()). */
  obtenerProductoPorSlug(slug: string): Promise<Producto | null>;
  /** Relacionados para la ficha: misma categoría, excluye el actual. */
  listarRelacionados(slug: string, limite?: number): Promise<Producto[]>;
  /** Todas las categorías (menú de filtros y landing). */
  listarCategorias(): Promise<Categoria[]>;
  /** Total que cumplen el filtro; base para paginación futura. */
  contarProductos(filtro?: ProductoFiltro): Promise<number>;
}
```

```ts
// lib/catalogo/index.ts  — ÚNICO punto de entrada permitido para app/ y components/
import type { CatalogoRepositorio } from "./repositorio";
import { repositorioDemo } from "./repositorio-demo";

export * from "./tipos";
export type { CatalogoRepositorio };

/** Fase 2: demo. Fase 3+: cambiar por `repositorioApi` (mismo tipo), sin tocar la UI. */
export const catalogo: CatalogoRepositorio = repositorioDemo;
```

```ts
// lib/catalogo/repositorio-demo.ts
import type { CatalogoRepositorio } from "./repositorio";
import type { Categoria, Producto, ProductoFiltro } from "./tipos";
import { productos as productosDemo } from "../../data/productos"; // ← ÚNICA puerta a data/
import { categorias as categoriasDemo } from "../../data/categorias";

function aplicarFiltro(productos: Producto[], f?: ProductoFiltro): Producto[] {
  let r = productos;
  if (f?.categoria) r = r.filter((p) => p.categoriaId === f.categoria);
  if (f?.busqueda) {
    const q = f.busqueda.trim().toLocaleLowerCase("es");
    r = r.filter((p) =>
      [p.nombre, p.marca, ...p.notas.salida, ...p.notas.corazon, ...p.notas.fondo]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(q),
    );
  }
  switch (f?.orden) {
    case "precio-asc":  r = [...r].sort((a, b) => a.precio - b.precio); break;
    case "precio-desc": r = [...r].sort((a, b) => b.precio - a.precio); break;
    case "novedades":   r = [...r].filter((p) => p.novedad); break;
    case "destacados":  r = [...r].filter((p) => p.destacado); break;
  }
  return r;
}

export const repositorioDemo: CatalogoRepositorio = {
  async listarProductos(f) { return aplicarFiltro(productosDemo, f); },
  async obtenerProductoPorSlug(slug) {
    return productosDemo.find((p) => p.slug === slug) ?? null;
  },
  async listarRelacionados(slug, limite = 4) {
    const actual = await this.obtenerProductoPorSlug(slug);
    if (!actual) return [];
    return productosDemo
      .filter((p) => p.slug !== slug && p.categoriaId === actual.categoriaId)
      .slice(0, limite);
  },
  async listarCategorias() { return categoriasDemo; },
  async contarProductos(f) { return aplicarFiltro(productosDemo, f).length; },
};
```

#### Reglas de la frontera (obligatorias)

1. **`app/**` y `components/**` sólo importan `@/lib/catalogo` y `@/lib/dinero`.** Nunca `@/data/*` (bloqueado por ESLint, sección 4.4).
2. **`data/**` sólo se importa desde `lib/catalogo/repositorio-demo.ts`.**
3. Todas las funciones devuelven `Promise`: la UI siempre hace `await`. Cambiar a red no toca ni un `await`.
4. Los tipos de retorno son de **dominio** (`Producto`), no de transporte. Cuando exista API, un mapeador `normalizarProductoApi()` traduce el JSON al tipo `Producto` dentro de `repositorio-api.ts`; si la API cambia, se cambia el mapeador, no la UI.
5. **No se escriben hoy archivos muertos:** no existe `repositorio-api.ts` ni `app/api/**`. Se crearán cuando exista el backend real, implementando *esta misma interfaz*.
6. Selección futura (único punto de cambio) en `lib/catalogo/index.ts`, decidida por variable de entorno de servidor:

```ts
// Fase 3+ (no implementar ahora):
const fuente = process.env.CATALOGO_FUENTE === "api" ? repositorioApi : repositorioDemo;
export const catalogo: CatalogoRepositorio = fuente;
```

7. **Paginación:** hoy el listado devuelve todo. Cuando llegue la API, `listarProductos` ganará un parámetro `pagina`/`limite` *opcional* y la página añadirá controles: cambio aditivo, no un rediseño.

#### Por qué no otra opción

- *Fetch a un JSON servido por `/public`:* añade latencia y manejo de errores sin aportar; el import estático ya es más rápido y es lo mismo que haría el servidor con la API.
- *Server Actions para leer datos:* acopla el frontend al runtime de Next y no sirve si más adelante el catálogo lo consume otra app (app móvil, mini-app de mensajería).
- *Estado global (Redux/Zustand) en Fase 2:* no hay estado compartido todavía; el carrito llegará en Fase 3 con su propio diseño.

---

## 7. Modo claro/oscuro sin parpadeo (FOUC)

**Decisiones:** atributo `data-theme="dark" | "light"` en `<html>`, tokens como variables CSS, script síncrono inline en el `<head>`, persistencia en `localStorage` bajo la clave **`peache-theme`** con valores **`dark` | `light` | `system`** (misma lengua que el atributo; ver `docs/decisiones.md` D-TEMA-1).

1. **Tokens dobles — la fuente única de verdad es `docs/design/tokens.css`, de `design`.**

> **Resolución de conflicto (PM, Fase 1):** este documento contenía un bloque de tokens *provisional* con nomenclatura en español (`--color-fondo`, `--color-superficie`, `--color-texto`, `--color-texto-tenue`, `--color-marca`, `--color-borde`, `--color-foco`, `--sombra-1`) y una paleta terracota (`#d97757`) ajena a la marca. `design` ya entregó el sistema definitivo: **93 tokens, contraste verificado con `check_contrast.py` en ambos modos**. Manda `design`. La regla es ahora:

- El bloque de tokens **se copia literalmente** de `docs/design/tokens.css` (`:root` para claro, `[data-theme="dark"]` para oscuro) a `app/globals.css`. No se reescribe ni se renombra.
- **Atributo `data-theme`**, no `data-tema`: es el selector real que declara `tokens.css`.
- Nombres de token en **inglés semántico** (`--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-border-strong`, `--color-focus`, `--color-accent`, `--shadow-1`, `--shadow-2`), nunca los antiguos nombres en español.
- El rosa de marca vive aislado en `--color-brand-provisional` y **no se usa en la UI** (ratio 2.76:1, sólo válido para el logo).

```css
/* Copiado literalmente de docs/design/tokens.css — ver ese archivo, no este documento */
:root { color-scheme: light; /* …93 tokens de modo claro… */ }
[data-theme="dark"] { color-scheme: dark; /* …los mismos 93 tokens en modo oscuro… */ }
```

**Regla:** *todo* token se define en ambos bloques. Un token sin par en el tema oscuro es un fallo de revisión.

2. **Script anti-FOUC** (síncrono, en `<head>` de `app/layout.tsx`, se ejecuta antes del primer pintado; sin `localStorage` accesible → sin parpadeo):

```tsx
const scriptTema = `(function(){try{
  var g=localStorage.getItem("peache-theme");
  if(g!=="dark"&&g!=="light"&&g!=="system") g="system";
  var oscuro = g==="dark" || (g!=="light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  var el=document.documentElement;
  el.dataset.theme = oscuro ? "dark" : "light";
  el.style.colorScheme = oscuro ? "dark" : "light";
}catch(e){}})();`;

// en el <head>:
<script dangerouslySetInnerHTML={{ __html: scriptTema }} />
```

3. **`<html lang="es" suppressHydrationWarning>`** — necesario porque el servidor no conoce el tema elegido y React avisaría de la diferencia de hidratación.
4. **`components/theme/ConmutadorTema.tsx`** (cliente): botón real `<button type="button">` con `aria-label` dinámico de **tres** textos («Cambiar a modo oscuro» → «Cambiar a modo claro» → «Seguir el sistema»; dos textos harían mentir al control en el tercer paso, WCAG 2.5.3), que alterna `light → dark → system`, escribe `peache-theme` en `localStorage`, aplica `dataset.theme` y `style.colorScheme` y queda suscrito a `window.matchMedia(...).addEventListener("change", …)` mientras la preferencia sea `system`.
5. **Sin clases condicionales por tema en los componentes:** sólo tokens (`color: var(--color-text)`). Así ningún componente conoce el tema.

---

## 8. Accesibilidad como requisito arquitectónico

Criterios de aceptación verificables en la revisión de la Fase 2 (WCAG 2.2 nivel AA):

- **Estructura:** `lang="es"` en `<html>`; **un único `<h1>` por página**; jerarquía `h2/h3` sin saltos; landmarks `<header>`, `<nav>`, `<main>`, `<footer>`; enlace «Saltar al contenido» como primer foco de `layout.tsx` apuntando a `#contenido`.
- **Color/contraste:** todo token de texto ≥ 4,5:1 sobre su fondo; bordes e iconos de interfaz ≥ 3:1. Verificar ambos temas con la herramienta de `design` antes de cerrar.
- **Teclado:** todo lo interactivo es `button` o `a` (nunca `div` con `onClick`); foco **siempre visible** mediante el token `--color-focus` (`:focus-visible`, anillo ≥ `--focus-width` con `--focus-offset` de separación); orden de tabulación = orden visual; los filtros del catálogo son enlaces navegables con teclado.
- **Objetivos táctiles:** mínimos **44×44 px** (botón de tema, filtros, tarjetas).
- **Texto alternativo:** `Producto.imagen.alt` obligatorio y descriptivo; iconos decorativos con `aria-hidden="true"`.
- **No usar color como única señal** de "Nuevo"/"Destacado": siempre acompañado de texto en `Etiqueta`.
- **Movimiento:** respetar `@media (prefers-reduced-motion: reduce)` (sin transiciones no esenciales).
- **Imágenes:** dimensiones/`aspect-ratio` fijos para CLS 0; `alt` vacío sólo si es puramente decorativa.
- **Formularios (cuando lleguen):** `<label>` asociado, errores junto al campo y anunciados (`role="alert"`), sin depender del placeholder como etiqueta.

---

## 9. Rendimiento como requisito arquitectónico

- **Server Components por defecto:** `'use client'` sólo donde haya interactividad real: `ConmutadorTema`, event handlers. En Fase 2 el objetivo es **≤ 3 archivos con `"use client"`**.
- **Cero `fetch` y cero estados de carga en Fase 2:** el HTML llega resuelto. No se usa `loading.tsx` porque no hay nada asíncrono que percibir.
- **Imágenes:** `next/image` con `sizes` correcto (`(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px` en el grid), `priority` **sólo en el LCP** (hero de `/` y primera imagen de la ficha), el resto `loading="lazy"`. Formato AVIF/WebP vía `next.config.ts`. Rutas locales limpias en `/public/productos/`.
- **Tipografías:** `next/font/local` con WOFF2 en `app/fonts/` (evita red durante `build` — relevante por la conectividad en Cuba; `next/font/google` requeriría Internet en cada build). Fuentes concretas: decisión del agente `design`; descargarlas requiere aprobación. Limitar a **2 familias / ≤ 4 pesos** y declarar `display: swap` y el `preload` que hace `next/font`.
- **Presupuestos:** JS inicial de `/` ≤ **100 KB gzip**; Lighthouse Performance ≥ **90** (móvil), Accessibility ≥ **95**, CLS < **0,1**, LCP < **2,5 s** en red 4G simulada.
- **CSS:** un solo `globals.css` (reset + tokens + base) y CSS Modules por componente; sin CSS-in-JS.
- **Evitar regresiones típicas:** no importar `data/productos.ts` en un cliente (arrastraría todo el catálogo al bundle); comprobarlo con `next build` (la salida indica el tamaño por ruta).

---

## 10. Verificación y calidad (gate antes de declarar la Fase 2 terminada)

Comandos que debe pasar en el workspace (sin instalar nada nuevo):

```
npm run lint        # ESLint flat config, incluye la regla de la frontera de datos
npm run typecheck   # tsc --noEmit con strict
npm run build       # compila todas las rutas y reporta tamaño por ruta
npm run dev         # revisión manual: /, /catalogo, /producto/inexistente (404), tema, 360px, 768px, 1440px
```

`tests/` queda **reservado y vacío en Fase 2** con un `README.md` que explique que los tests unitarios (`vitest`) y E2E (`playwright`) están pendientes de aprobación de dependencias (sección 2.3). No se escribe código de test con un runner que no está instalado.

---

## 11. Riesgos y dependencias

| # | Riesgo | Impacto | Mitigation / cuándo actuar |
|---|---|---|---|
| R1 | **No hay repositorio git** en el workspace | Alto: no hay historial ni rollback ante un error | Proponer `git init` + `.gitignore` **antes** de escribir código de aplicación (solicitar permiso al usuario; `AGENTS.md` prohíbe acciones destructivas, `git init` no lo es pero se avisa) |
| R2 | Fijar versiones ahora y que queden desactualizadas | Bajo | Versions pinned en `package.json`; actualizaciones sólo en ventana de mantenimiento y anotando el cambio en este documento |
| R3 | Datos demo llegando a producción | Medio | Carpeta `data/` + README + aviso visible en UI + regla ESLint; al llegar backend se despliega `repositorioApi` (sección 6.4) |
| R4 | `create-next-app` sobrescribe `AGENTS.md` (viene con `--agents-md` por defecto) | Alto (pierde instrucciones del proyecto) | Scaffolding manual (sección 2.2). **No ejecutar `create-next-app` en la raíz** |
| R5 | Red inestable en Cuba durante `build` (fuentes Google, imágenes remotas) | Medio | `next/font/local` + imágenes locales; ningún dominio remoto en `next.config.ts` |
| R6 | Habilitar caché/PPR de Next 16 sin entenderla | Medio | `cacheComponents` **desactivado** en Fase 2; revisar sólo cuando exista API |
| R7 | TS 7.x (nativo) aún no validada con el ecosistema Next/ESLint | Medio | Fijar `typescript@5.9.3`; migrar a 6/7 en una tarea dedicada con `npm run typecheck` + `npm run build` como gate |
| R8 | Decisiones comerciales congeladas en tipos (moneda, precios) | Medio | `Moneda` es una unión literal de 1 valor; cambiarla es una línea + `formatearPrecio` |
| R9 | El diseño (agente `design`) puede traer componentes que no encajen en la estructura | Bajo | Los tokens de `globals.css` y la estructura de carpetas son lo que se congela; los componentes se adaptan |

---

## 12. Decisiones pendientes (NO tomar sin aprobación del cliente)

> Ninguna de estas se toma en Fase 2. Cada una incluye **criterios de evaluación** y **cuándo abordarla**. Ninguna está decidida; ninguna debe aparecer en el código como si lo estuviera.

| # | Decisión | Criterios de evaluación | Cuándo abordarla |
|---|---|---|---|
| D1 | **Base de datos** | Coste en USD y forma de pago desde Cuba; latencia percibida desde Cuba; complejidad de backup/restore; escape (exportación); si admite el modelo de catálogo + pedidos; curva del equipo. Candidatas a comparar: Postgres gestionado, SQLite/Postgres en VPS propio, BaaS (p. ej. Supabase/Firebase) | Antes de la Fase 3 (cuando exista API real). **Pendiente de aprobación** |
| D2 | **Autenticación** | Que funcione sin SMS ni correo transaccional si la entregabilidad en Cuba es dudosa; manejo de contraseñas (hash, reseteo); sesiones vs JWT; roles (cliente/admin) mínimos; coste; si exige servicio externo (riesgo de bloqueo de pago) | Antes de `/cuenta` (Fase 5). **Pendiente de aprobación** |
| D3 | **Pasarela de pago / cobro** | Qué instrumentos existen y funcionan para clientes en Cuba (tarjetas emitidas localmente, transferencias, MLC, contra entrega); comisiones; idoneidad para el vendedor; cumplimiento; alternativa manual (pedido por WhatsApp + confirmación manual) como fase intermedia | Antes de `/checkout` real (Fase 4). **Pendiente de aprobación** |
| D4 | **Alojamiento + dominio** | Capacidad de pagar el servicio desde Cuba; latencia desde Cuba y a la audiencia; soporte Next.js (build/ISR/node); HTTPS y dominio propio (.cu vs otro); coste mensual fijo; backup | Antes de la beta pública (tras Fase 2). **Pendiente de aprobación** |
| D5 | **Moneda y política de precios** | Mostrar CUP, MLC o ambos; redondeos; si los precios incluyen impuesto; quién actualiza precios y con qué frecuencia | Antes de mostrar precios "reales" (inmediatamente antes de sustituir los datos demo) |
| D6 | **Estilos: CSS Modules vs Tailwind** | Decidido **CSS Modules** para Fase 2 (sección 2). Reabrir sólo si `design` justifica utility classes y se acepta instalar `tailwindcss@4.3.3` | Solo si `design` lo pide con justificación |
| D7 | **Contenido estático y legal** | Aviso de privacidad, condiciones de venta, política de devoluciones, datos de contacto reales | Antes de la beta pública |
| D8 | **Herramientas de testing** | Coste de mantenimiento de la suite vs. tamaño del equipo; `vitest` para unitarias y `playwright` para E2E son los candidatos (versiones ya consultadas) | Fase 3 (unitarias) / Fase 4 (E2E); **requiere aprobación para instalar** |

---

## 13. Fuera de alcance de la Fase 2 (no diseñar ni implementar ahora)

Backend real, base de datos, autenticación, pagos, pedidos reales, inventario, stock, envío de correos, integraciones externas, CMS, i18n multiidioma (la UI es **español** y se queda así por ahora), y cualquier Route Handler bajo `app/api/`. El contrato de lo que vendrá está en **`docs/api-contracto.md`**.
