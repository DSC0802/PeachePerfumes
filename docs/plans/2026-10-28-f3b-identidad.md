# F3-B · Identidad y acceso — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir la puerta del dashboard: registro/login/sesión de 30 días con scrypt nativo, perfil, navbar por estado y `/dashboard` protegida con **403 real** vía `proxy.ts` (Next 16).

**Architecture:** Server actions con `useActionState` para los formularios; `lib/auth/` con módulos puros (`contrasena`, `validadores`, `tipos`, `sesiones` capa BD sobre el pool propio `base`) más `repositorio-usuarios`, la capa `next/headers` (`acceso`) y las server actions (`acciones`); `proxy.ts` en la raíz (runtime Node) valida la sesión contra BD y responde 403 con HTML autocontenido (`pagina-403`); el layout de `/dashboard` re-verifica (defensa en profundidad); el layout raíz lee la sesión y la pasa a `Cabecera`.

**Tech Stack:** Next.js 16.4.3 (App Router, server actions, `proxy.ts`), React 19 (`useActionState`), `node:crypto` scrypt (SIN dependencias nuevas), PostgreSQL 18 + Drizzle 0.45, Vitest (unit) + Playwright (E2E), CSS Modules + tokens de `globals.css`.

**Spec:** `docs/specs/2026-10-28-f3b-identidad-design.md` (aprobado). Fuente de verdad de reglas: §4 esquema, §5 auth, §6 proxy/403, §7 pantallas, §8 semilla, §9-10 pruebas/gates, §11 seguridad.

---

## Notas obligatorias para quien ejecute (contexto cero)

1. **Convención del repo**: español con tildes en código/comentarios/mensajes; punto y coma; comillas dobles; 2 espacios; sin `any` (`strict` + `noUnusedLocals`). Cada componente con su `X.module.css` (excepción documentada: los 3 formularios de identidad comparten `FormularioAuth.module.css`, T5).
2. **Server actions**: es la PRIMERA vez en el repo. El archivo de actions lleva `"use server"` como PRIMERA línea. Los formularios cliente usan `useActionState(accion, estadoInicial)`. `redirect()` se llama DENTRO de la action (lanza internamente); nunca se ejecuta código tras `redirect()`.
3. **Componentes reales existentes** (no inventar nombres): `CampoTexto` (`etiqueta`, `id`, `tipo?: "search"|"text"|"email"|"tel"|"number"`, `ayuda?`, `error?` con `role="alert"` interno, resto de props de `<input>` — acepta `name`, `required`, `minLength`, `maxLength`, `autoComplete`, `defaultValue`, `readOnly`), `Boton` (`variante?: "primario"|"secundario"|"terciario"|"peligro"`, `loading?`, `href?`, `type?`), `Contenedor` (`ancho?: "maximo"|"estrecho"|"ancho"`), `EstadoVacio` (`titulo`, `apoyo?`, `nivelTitulo?`, `children?`), `Enlace` (`href`, children; interno → `next/link`), `Etiqueta`. **No existe** `Campo`/`Formulario`. **`CampoTexto` NO tiene `"password"`** → en T5 se le suma a la unión de `tipo` (cambio aditivo justificado: los formularios de login/registro lo necesitan).
4. **`Cabecera` es `"use client"`** (`components/layout/Cabecera.tsx`) y no recibe props hoy; `Navegacion` es un array `ENLACES` estático (Inicio/Catálogo). El layout raíz es server y NO lee cookies hoy. `HojaModal` usa `<dialog>` nativo con `showModal()`: cerrado, su contenido NO es visible (importa en los E2E: hay DOS `<nav aria-label="Cuenta">` en el DOM; se apunta a la visible con `.filter({ visible: true })`).
5. **Patrón de repositorio BD** (`lib/catalogo/repositorio-postgres.ts`): pool perezoso `let pool: Pool | null = null; pool ??= new Pool({ connectionString: url, max: 5 });`, error claro si falta `DATABASE_URL`, `type FilaX = typeof tablaX.$inferSelect`, mappers fila→dominio privados. `lib/auth` replica ese patrón con **su propio pool** en `lib/auth/base.ts` (no tocar `repositorio-postgres.ts`); `repositorio-usuarios.ts` y `sesiones.ts` comparten ese ÚNICO pool de auth (no abren dos).
6. **Esquema** (`db/schema.ts`): `pgEnum("nombre_snake", [...])` a nivel módulo; `pgTable("tabla", {...}, (tabla) => [uniqueIndex(...), index(...)])` (array de callbacks, drizzle 0.45); timestamps `timestamp("x", { withTimezone: true }).notNull().defaultNow()`; uuid `uuid("id").defaultRandom().primaryKey()`; FK `.references(() => t.id, { onDelete: "cascade" })`. Ya existe `estadoProducto` y la migración `db/migraciones/0000_amazing_major_mapleleaf.sql` → la nueva será `0001_*` (nombre aleatorio generado por `drizzle-kit`).
7. **ESLint**: `no-restricted-imports` sólo afecta a `app/**` y `components/**` y prohíbe `@/data/*` — `lib/auth/**` y `proxy.ts` NO pueden importar `@/data/*`... **regla: tampoco lo hacen** (identidad no toca `data/`). `eslint .` sí revisa `proxy.ts` (no está en `globalIgnores`).
8. **Alias** `@/*` → raíz (tsconfig + vitest + eslint-config-next). Imports relativos dentro de `lib/auth/` y `../../db/schema` desde `lib/auth/`.
9. **Tests**: `describe`/`it` en español. **NUNCA** se toca `tests/unit/catalogo.test.ts`, `tests/integracion/`, `tests/accesibilidad.spec.ts`, `tests/flujo-compra.spec.ts`, `tests/cierre-dialogos.spec.ts` (los 48 unit + 19 E2E existentes intactos, literalmente). Todo lo nuevo va en `tests/unit/auth.test.ts` y `tests/identidad.spec.ts`.
10. **E2E**: `playwright.config.ts` — `baseURL` http://localhost:3000, webServer `npm run build && npm run start` con health-check en `/catalogo`, `fullyParallel`. El admin de E2E sale de `.env.local`: el config carga las claves con `process.loadEnvFile(".env.local")` (try/catch) **sin imprimirlas jamás**.
11. **`.env.local`** es gitignored: se le añaden `ADMIN_EMAIL` y `ADMIN_PASSWORD`. **Jamás** se muestra su contenido en un informe ni se commitea (verificar con `git check-ignore .env.local` y `git ls-files .env.local`).
12. **Dinamismo**: leer `cookies()` en el layout raíz (T10) convierte todas las rutas en dinámicas (ƒ) en el build — **esperado y documentado** (decisión D-F3B-DINAMICO). El gate es `npm run build` → exit 0, no la marca de las rutas.
13. **Sin fallback**: si la BD falla, las actions devuelven error en español y `/dashboard` muestra su error — nunca datos falsos.
14. **Commits** B1…B11 con los mensajes dados en cada tarea (patrón `F3-B: …`). No commitear `.env.local`.
15. **PowerShell**: capturar `$LASTEXITCODE` inmediatamente tras cada comando (nunca con `Tee-Object`, que lo pisa). `psql` con ruta completa: `$psql = (Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" | Sort-Object FullName -Descending | Select-Object -First 1).FullName`. **Jamás imprimir** `DATABASE_URL`, `ADMIN_PASSWORD` ni tokens.

## Mapa de ficheros

| Acción | Fichero | Responsabilidad |
|---|---|---|
| Crear | `lib/auth/contrasena.ts` | scrypt: `hashContrasena`, `verificarContrasena`, `longitudClaveValida`, `LONGITUD_MINIMA/MAXIMA` |
| Crear | `lib/auth/validadores.ts` | `normalizarEmail`, `emailValido`, `validarNext` |
| Crear | `lib/auth/tipos.ts` | `Rol`, `Usuario`, `CredencialUsuario`, `EstadoFormulario` (puro, sin imports de BD/next) |
| Crear | `lib/auth/base.ts` | pool perezoso PROPIO de auth (max 5) + `obtenerBase()` |
| Crear | `lib/auth/repositorio-usuarios.ts` | `crearUsuario`, `buscarCredencialPorEmail`, `actualizarPerfilUsuario` (Drizzle, vía `./base`) |
| Crear | `lib/auth/sesiones.ts` | token+hash+BD: `crearSesion`, `buscarSesionValida`, `borrarSesion`, `hashearToken`, `NOMBRE_COOKIE`, `SEGUNDOS_SESION`, `OPCIONES_COOKIE_SESION` (puro: NO importa `next/headers`) |
| Crear | `lib/auth/acceso.ts` | capa `next/headers`: `obtenerSesionActual`, `requerirAdmin` |
| Crear | `lib/auth/acciones.ts` | `"use server"`: `iniciarSesion`, `registrarUsuario`, `cerrarSesion`, `actualizarPerfil` (+ helper privado `fijarCookieSesion`) |
| Crear | `lib/auth/pagina-403.ts` | `pagina403()` — HTML autocontenido del 403 (para el proxy) |
| Crear | `proxy.ts` | guard de `/dashboard/*` (matcher), 403 real (raíz; NO `middleware.ts`) |
| Crear | `app/login/page.tsx` + `components/auth/FormularioLogin.tsx` | HU-11 |
| Crear | `app/registro/page.tsx` + `components/auth/FormularioRegistro.tsx` | HU-10 |
| Crear | `app/perfil/page.tsx` + `components/auth/FormularioPerfil.tsx` | HU-15 |
| Crear | `components/auth/FormularioAuth.module.css` | **1 CSS module compartido** por los 3 formularios (DRY, justificado en T5) |
| Crear | `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `components/dashboard/IndiceSecciones.tsx` (+ module.css) | HU-16/17 + índice |
| Crear | `components/layout/CuentaAcciones.tsx` (+ module.css) | navbar por estado de cuenta (invitado/cliente/admin) |
| Modificar | `db/schema.ts` | + enums/tablas `usuarios`, `sesiones` (migración `0001_*`) |
| Modificar | `db/seed.ts` | + upsert admin desde `ADMIN_EMAIL`/`ADMIN_PASSWORD` (nunca borra usuarios/sesiones) |
| Modificar | `components/ui/CampoTexto.tsx` | + `"password"` en la unión de `tipo` (T5) |
| Modificar | `app/layout.tsx` | `async`, lee sesión, pasa `cuenta` a `Cabecera` |
| Modificar | `components/layout/Cabecera.tsx` | prop `cuenta`, monta `CuentaAcciones` (escritorio + menú móvil) |
| Modificar | `playwright.config.ts` | carga `.env.local` para las credenciales de E2E |
| Modificar | `.env.local` | + `ADMIN_EMAIL`, `ADMIN_PASSWORD` (NO se commitea) |
| Crear | `tests/unit/auth.test.ts` | unit de contrasena + validadores + sesiones (12 nuevos) |
| Crear | `tests/identidad.spec.ts` | E2E de identidad (11 nuevos) |
| Modificar | `docs/decisiones.md`, `docs/historias-usuario.md`, `docs/arquitectura.md` | docs T12 |

**Sin cambios (por diseño):** `tests/accesibilidad.spec.ts` y las otras 4 suites existentes; `components/layout/Navegacion.tsx` (sigue con Inicio/Catálogo); `lib/catalogo/**`; `docs/design/componentes.md` (verificado en T12: NO documenta la unión `tipo` de `CampoTexto`, así que no se toca).

## Compromiso de pruebas por tarea (razón documentada)

Unit (vitest) **TDD en el momento** para lógica pura (T2 contraseñas, T3 validadores, T4 sesiones): test rojo → implementación → verde. El E2E (`tests/identidad.spec.ts`) se escribe y ejecuta en **T11, consolidado**, porque cada ejecución de Playwright obliga a `build+start` fresco (~1-2 min) y ejecutarlo en las 7 tareas de UI multiplicaría el tiempo sin ganar cobertura (los gates finales de T13 lo exigen en verde). En cada tarea intermedia: `typecheck` + `lint` + `vitest` completos.

Totales esperados de vitest por tarea: T2 → 55 (48 intactas + 7), T3 → 58 (+3), T4 → 60 (+2). Playwright en T11/T13: 19 intactos + 11 nuevos = **30**. El literal final lo reporta T13.

---

## Tareas

### T1 · Esquema — `usuarios` y `sesiones` (migración `0001`)

**Files:**
- `db/schema.ts` (modificar: añade `rol_usuario`, `usuarios`, `sesiones`)
- `db/migraciones/0001_*.sql` (generado con `npm run db:generate`, NO escribir a mano)

**Pasos**
- [x] Añadir al final de `db/schema.ts` (después de `productos`, antes del cierre del fichero):

```ts
/* ========================= F3-B · Identidad ========================= */

/** Rol de usuario (F3-B §4). */
export const rolUsuario = pgEnum("rol_usuario", ["admin", "cliente"]);

/** Usuarios de la tienda (F3-B §4). */
export const usuarios = pgTable(
  "usuarios",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    nombre: text("nombre"),
    telefono: text("telefono"),
    rol: rolUsuario("rol").notNull().default("cliente"),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [index("usuarios_email_idx").on(tabla.email)],
);

/** Sesiones activas (F3-B §4: expira_en fija a +30 días, sin sliding). */
export const sesiones = pgTable(
  "sesiones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    creadaEn: timestamp("creada_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiraEn: timestamp("expira_en", { withTimezone: true }).notNull(),
  },
  (tabla) => [
    index("sesiones_usuario_id_idx").on(tabla.usuarioId),
    index("sesiones_expira_en_idx").on(tabla.expiraEn),
  ],
);
```

> Regla F3-A §8 (vigente en F3-B): `uniqueIndex()` se declara **en el callback de tabla** (drizzle-kit 0.31 emite `.unique()` de columna como CONSTRAINT de tabla; `uniqueIndex()` genera el `CREATE UNIQUE INDEX` que pide el plan F3-A). Para `email` y `token_hash` basta con `.unique()` en la columna (código más limpio, equivalente); los índices de consulta (`usuario_id`, `expira_en`) van en el callback.

- [x] Ejecutar `npm run db:generate`.
- [x] Ejecutar `npm run db:migrate`.
- [x] Evidencia BD: `...\PostgreSQL\18\bin\psql.exe -d peache -c "\dt"` debe listar `sesiones` y `usuarios`; `... -c "SELECT rol, count(*) FROM usuarios GROUP BY rol;"` → `cliente | N` (y `admin | 0` tras T4).
- [x] `npm run typecheck` → exit 0.
- [x] `npm run lint` → exit 0.

**Commit B1:** `F3-B: esquema de usuarios y sesiones (migracion 0001)`

**Nota de ejecución (borrador del autor):** `npm run db:generate` crea `db/migraciones/0001_<aleatorio>.sql` con el nombre aleatorio de drizzle-kit (p. ej. `0001_witty_cake_mapleleaf.sql`). No editar el `.sql` generado; si `db:generate` advierte que el esquema está al día, revisar que el `pgTable` de `sesiones` se escribió exactamente como arriba (índices con `(tabla) => [...]`).
- [x] **T2 · Contraseñas (TDD)** — `tests/unit/auth.test.ts` (fallando) → `lib/auth/contrasena.ts` → verde. **Commit B2 (con T3):** `F3-B: scrypt nativo y validadores de identidad`
- [x] **T3 · Validadores (TDD)** — tests de email/`?next` → `lib/auth/validadores.ts` → verde. **Commit B2**
- [x] **T4 · BD de usuarios y sesiones + admin** — `tipos.ts`, `base.ts`, `repositorio-usuarios.ts`, `sesiones.ts` + upsert admin en `db/seed.ts` (+ `.env.local` con ADMIN_*) → semilla ×2 ⇒ 1 admin → typecheck/lint/vitest. **Commit B3:** `F3-B: repositorios de usuarios y sesiones, admin en semilla`
- [x] **T5 · Login** — `CampoTexto` (+`password`), `acceso.ts`, `acciones.ts` (`iniciarSesion`, `cerrarSesion`), `FormularioAuth.module.css`, `app/login/`, `FormularioLogin`. **Commit B4:** `F3-B: login y cierre de sesion con server actions`
- [x] **T6 · Registro** — `registrarUsuario` + `app/registro/`, `FormularioRegistro` (auto-login tras registrar). **Commit B5:** `F3-B: registro de cuentas`
- [x] **T7 · Perfil** — `actualizarPerfil` + `app/perfil/` (guard de sesión), `FormularioPerfil`. **Commit B6:** `F3-B: perfil editable (nombre y telefono)`
- [x] **T8 · Proxy + 403** — `pagina-403.ts`, `proxy.ts` (matcher `/dashboard/:path*`), verificación con `next start` + curl (403 con cuerpo literal). **Commit B7:** `F3-B: proxy de /dashboard con 403 real`
- [x] **T9 · Dashboard** — `app/dashboard/layout.tsx` (re-verificación), `page.tsx` (bienvenida + índice), `IndiceSecciones`. **Commit B8:** `F3-B: dashboard protegido con bienvenida e indice`
- [x] **T10 · Navbar por estado** — `app/layout.tsx` async + prop `cuenta` en `Cabecera` + `CuentaAcciones` (escritorio y menú móvil) → `npm run build` (rutas ƒ esperadas). **Commit B9:** `F3-B: navbar segun el estado de sesion`
- [x] **T11 · E2E consolidado** — `playwright.config.ts` (carga `.env.local`) + `tests/identidad.spec.ts` completo → suite en verde. **Commit B10:** `F3-B: suites E2E de identidad`
- [x] **T12 · Docs** — `decisiones.md` (sección F3-B + D-F3B-*), `historias-usuario.md` (HU-10,11,12,14,15,16,17 → ✅), `arquitectura.md` (árboles `lib/auth/`, `proxy.ts`, rutas). **Commit B11:** `F3-B: documentacion de identidad y decisiones`
- [x] **T13 · Puerta final** — 5 gates en exit 0 con salidas literales + semilla ×2 (1 admin) + `git status` limpio + resumen en español.

## Detalle de tareas

### T1 · Esquema — `usuarios`, `sesiones` y migración `0001`

**Files:** `db/schema.ts` (modificar) · `db/migraciones/0001_*.sql` (generado por drizzle-kit)

**Objetivo:** las tablas de identidad de la spec §4 en la BD, con su migración aplicada. El esquema NO se tocará más en F3-B.

**Prerrequisito:** servicio de PostgreSQL arrancado y `.env.local` con `DATABASE_URL` (hecho en F3-A).

- [ ] 1. Añade al FINAL de `db/schema.ts` (los imports necesarios —`pgEnum`, `pgTable`, `text`, `timestamp`, `uuid`, `uniqueIndex`, `index`— ya están en el fichero):

```ts

/* ===========================================================================
   Esquema F3-B — Identidad (docs/specs/2026-10-28-f3b-identidad-design.md §4)
   =========================================================================== */

/** Rol de usuario (spec F3-B §4) — espejo de `Rol` en `lib/auth/tipos.ts`. */
export const rolUsuario = pgEnum("rol_usuario", ["admin", "cliente"]);

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
    uniqueIndex("usuarios_email_unique").on(tabla.email),
  ],
);

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
    uniqueIndex("sesiones_token_hash_unique").on(tabla.tokenHash),
    index("sesiones_usuario_idx").on(tabla.usuarioId),
    // Limpieza de caducadas (spec §4): índice para `lt(expiraEn, now)`.
    index("sesiones_expira_idx").on(tabla.expiraEn),
  ],
);
```

- [ ] 2. Genera y aplica la migración:

```powershell
npm run db:generate
# → crea db/migraciones/0001_<nombre-aleatorio>.sql (NO hay que escribirlo a mano)
npm run db:migrate
$LASTEXITCODE   # → 0
```

- [ ] 3. **Lee la migración generada** y comprueba que contiene: `CREATE TYPE "rol_usuario"`, `CREATE TABLE "usuarios"` (con `UNIQUE`/`CREATE UNIQUE INDEX` sobre `email`), `CREATE TABLE "sesiones"` con la FK `ON DELETE CASCADE` a `usuarios` y los índices de `token_hash`, `usuario_id` y `expira_en`. Si falta algo, ajusta `db/schema.ts` aquí (no se deja nada a medias).

- [ ] 4. Verificación psql (guardar salida literal):

```powershell
$psql = (Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" | Sort-Object FullName -Descending | Select-Object -First 1).FullName
& $psql -U postgres -d peache -c "\dt"
# → salen 4 tablas: categorias, productos, sesiones, usuarios
& $psql -U postgres -d peache -c "\d usuarios"
# → columnas id/email/password_hash/nombre/telefono/rol/creado_en/actualizado_en + índice usuarios_email_unique
& $psql -U postgres -d peache -c "\d sesiones"
# → columnas id/usuario_id/token_hash/creada_en/expira_en + FK cascade + 3 índices
```

- [ ] 5. `npm run typecheck` → exit 0 (`$LASTEXITCODE` → 0).

**→ Commit B1:** `db/schema.ts`, `db/migraciones/0001_*.sql`.
Mensaje: `F3-B: esquema de usuarios y sesiones (migracion 0001)`

### T2 · Contraseñas con scrypt nativo (TDD)

**Files:** `tests/unit/auth.test.ts` (crear) · `lib/auth/contrasena.ts` (crear)

**Objetivo:** hash/verify de contraseña con `node:crypto` scrypt (N=16384, r=8, p=1, keylen=64, sal de 16 B), formato `scrypt$N$r$p$salB64$claveB64`, verificación `timingSafeEqual`, y **nunca lanzar** desde `verificarContrasena` (formato corrupto → `false`). Cero dependencias nuevas (spec §3).

- [ ] 1. Crea el test (ROJO: `@/lib/auth/contrasena` no existe todavía):

**Archivo nuevo `tests/unit/auth.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import {
  LONGITUD_MAXIMA,
  LONGITUD_MINIMA,
  hashContrasena,
  longitudClaveValida,
  verificarContrasena,
} from "@/lib/auth/contrasena";

/**
 * Tests unitarios de identidad (spec F3-B §5 y §9).
 * Sólo lógica pura: nada aquí toca la BD ni `next/headers`.
 * Las suites existentes (catalogo, integracion, E2E) NO se tocan.
 */

describe("contraseñas (scrypt nativo)", () => {
  it("hashea y verifica la misma contraseña", async () => {
    const hash = await hashContrasena("ClaveSegura-2026");
    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    await expect(
      verificarContrasena("ClaveSegura-2026", hash),
    ).resolves.toBe(true);
  });

  it("rechaza una contraseña distinta", async () => {
    const hash = await hashContrasena("ClaveSegura-2026");
    await expect(
      verificarContrasena("OtraClave-2026", hash),
    ).resolves.toBe(false);
  });

  it("dos hashes de la misma contraseña son distintos (sal aleatoria)", async () => {
    const [a, b] = await Promise.all([
      hashContrasena("ClaveSegura-2026"),
      hashContrasena("ClaveSegura-2026"),
    ]);
    expect(a).not.toBe(b);
  });

  it("el formato guarda sal de 16 B y clave de 64 B en base64", async () => {
    const hash = await hashContrasena("ClaveSegura-2026");
    const [, , , , salB64, claveB64] = hash.split("$");
    expect(Buffer.from(salB64, "base64")).toHaveLength(16);
    expect(Buffer.from(claveB64, "base64")).toHaveLength(64);
  });

  it("un hash corrupto devuelve false sin lanzar", async () => {
    const corruptos = [
      "",
      "no-es-un-hash",
      "scrypt$abc",
      "bcrypt$16384$8$1$c2FsdGFuZQ==$a2xhdW5zZQ==",
    ];
    for (const corrupto of corruptos) {
      await expect(
        verificarContrasena("ClaveSegura-2026", corrupto),
      ).resolves.toBe(false);
    }
  });

  it("longitudClaveValida cubre los bordes 8 y 128", () => {
    expect(longitudClaveValida("a".repeat(LONGITUD_MINIMA - 1))).toBe(false);
    expect(longitudClaveValida("a".repeat(LONGITUD_MINIMA))).toBe(true);
    expect(longitudClaveValida("a".repeat(LONGITUD_MAXIMA))).toBe(true);
    expect(longitudClaveValida("a".repeat(LONGITUD_MAXIMA + 1))).toBe(false);
  });

  it("hashContrasena rechaza claves fuera de rango", async () => {
    await expect(hashContrasena("corta")).rejects.toThrow(
      "La contraseña debe tener entre 8 y 128 caracteres.",
    );
  });
});
```

```powershell
npx vitest run tests/unit/auth.test.ts
# → ROJO esperado: no se puede resolver "@/lib/auth/contrasena"
```

- [ ] 2. Implementa (VERDE):

**Archivo nuevo `lib/auth/contrasena.ts`:**

```ts
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hash de contraseña con scrypt de `node:crypto` (spec F3-B §5):
 * N=16384, r=8, p=1, keylen=64, sal aleatoria de 16 B por usuario.
 * Formato almacenado: `scrypt$N$r$p$salBase64$claveBase64`.
 * Cero dependencias nuevas (spec §3). La comparación es timing-safe.
 */

const scryptAsync = promisify(scrypt);

export const LONGITUD_MINIMA = 8; // spec §5
export const LONGITUD_MAXIMA = 128; // tope anti-DoS (spec §5)

const PARAMETROS = { N: 16384, r: 8, p: 1 } as const;
const LONGITUD_CLAVE = 64;
const LONGITUD_SAL = 16;

// Límites sanos para parsear hashes ajenos (spec §11): un hash corrupto o
// con parámetros absurdos NO debe convertirse en una bomba de CPU.
const N_MAXIMO = 2 ** 20;
const R_MAXIMO = 32;
const P_MAXIMO = 16;

export function longitudClaveValida(contrasena: string): boolean {
  return (
    contrasena.length >= LONGITUD_MINIMA && contrasena.length <= LONGITUD_MAXIMA
  );
}

export async function hashContrasena(contrasena: string): Promise<string> {
  if (!longitudClaveValida(contrasena)) {
    throw new Error(
      `La contraseña debe tener entre ${LONGITUD_MINIMA} y ${LONGITUD_MAXIMA} caracteres.`,
    );
  }
  const sal = randomBytes(LONGITUD_SAL);
  const clave = (await scryptAsync(contrasena, sal, LONGITUD_CLAVE, PARAMETROS)) as Buffer;
  return [
    "scrypt",
    PARAMETROS.N,
    PARAMETROS.r,
    PARAMETROS.p,
    sal.toString("base64"),
    clave.toString("base64"),
  ].join("$");
}

/**
 * Verifica una contraseña contra el formato `scrypt$N$r$p$sal$clave`.
 * NUNCA lanza: formato corrupto, parámetros fuera de límites sanos o
 * errores de scrypt → `false` (el caller decide el mensaje).
 */
export async function verificarContrasena(
  contrasena: string,
  almacenado: string,
): Promise<boolean> {
  const partes = almacenado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") {
    return false;
  }
  const [, nTexto, rTexto, pTexto, salB64, claveB64] = partes;
  const N = Number(nTexto);
  const R = Number(rTexto);
  const P = Number(pTexto);
  if (!Number.isInteger(N) || !Number.isInteger(R) || !Number.isInteger(P)) {
    return false;
  }
  if (N < 2 || N > N_MAXIMO || R < 1 || R > R_MAXIMO || P < 1 || P > P_MAXIMO) {
    return false;
  }
  const sal = Buffer.from(salB64, "base64");
  const claveEsperada = Buffer.from(claveB64, "base64");
  if (sal.length === 0 || claveEsperada.length !== LONGITUD_CLAVE) {
    return false;
  }
  let clave: Buffer;
  try {
    clave = (await scryptAsync(contrasena, sal, claveEsperada.length, {
      N,
      r: R,
      p: P,
    })) as Buffer;
  } catch {
    return false; // scrypt puede fallar con parámetros hostiles
  }
  if (clave.length !== claveEsperada.length) {
    return false;
  }
  return timingSafeEqual(clave, claveEsperada);
}
```

- [ ] 3. Ejecuta la suite completa (las 48 existentes siguen intactas):

```powershell
npx vitest run
# → Test  55 passed (48 intactas + 7 nuevas)
$LASTEXITCODE   # → 0
```

- [ ] 4. `npm run typecheck` → 0 · `npm run lint` → 0.

**No se commitea aún** (el commit B2 engloba T2+T3).

### T3 · Validadores de email y `?next=` (TDD)

**Files:** `tests/unit/auth.test.ts` (ampliar) · `lib/auth/validadores.ts` (crear)

**Objetivo:** normalización de email, validación de email y defensa anti open-redirect de `?next=` (spec §5: sólo rutas internas que empiezan por `/`, nunca `//` ni `/\`).

- [ ] 1. Añade estos imports al FINAL del bloque de imports de `tests/unit/auth.test.ts` y este `describe` al final del fichero (ROJO: `@/lib/auth/validadores` no existe):

```ts
import {
  emailValido,
  normalizarEmail,
  validarNext,
} from "@/lib/auth/validadores";
```

```ts
describe("validadores de identidad", () => {
  it("normalizarEmail recorta y pasa a minúsculas", () => {
    expect(normalizarEmail("  Cliente@Ejemplo.cu ")).toBe("cliente@ejemplo.cu");
  });

  it("emailValido acepta válidos y rechaza inválidos", () => {
    expect(emailValido("cliente@ejemplo.cu")).toBe(true);
    expect(emailValido("a.b+c@sub.dominio.cu")).toBe(true);
    expect(emailValido("sin-arroba.ejemplo.cu")).toBe(false);
    expect(emailValido("cliente@sin-punto")).toBe(false);
    expect(emailValido("clien te@ejemplo.cu")).toBe(false);
    expect(emailValido("")).toBe(false);
    expect(emailValido(`${"a".repeat(250)}@ejemplo.cu`)).toBe(false); // > 254
  });

  it("validarNext acepta rutas internas y rechaza el resto (anti open-redirect)", () => {
    expect(validarNext("/dashboard")).toBe("/dashboard");
    expect(validarNext("/")).toBe("/");
    expect(validarNext("/catalogo?buscar=sol")).toBe("/catalogo?buscar=sol");
    expect(validarNext("https://evil.example")).toBeNull();
    expect(validarNext("//evil.example")).toBeNull();
    expect(validarNext("/\\evil.example")).toBeNull();
    expect(validarNext("dashboard")).toBeNull();
    expect(validarNext("")).toBeNull();
    expect(validarNext(null)).toBeNull();
    expect(validarNext(undefined)).toBeNull();
    expect(validarNext(42)).toBeNull();
    expect(validarNext("/con\nsalto")).toBeNull();
    expect(validarNext('/con"comilla')).toBeNull();
  });
});
```

```powershell
npx vitest run tests/unit/auth.test.ts
# → ROJO esperado: no se puede resolver "@/lib/auth/validadores"
```

- [ ] 2. Implementa (VERDE):

**Archivo nuevo `lib/auth/validadores.ts`:**

```ts
/**
 * Validadores de identidad (spec F3-B §5 y §11).
 * Puros: sin imports de BD ni de next/headers (testables con vitest).
 */

/** Email canónico: trim + minúsculas (spec §4: columna normalizada). */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Forma práctica sin dependencias: algo @ algo . algo, sin espacios.
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(email: string): boolean {
  // RFC 5321: 254 es el tope de longitud de una dirección completa.
  if (email.length === 0 || email.length > 254) {
    return false;
  }
  return REGEX_EMAIL.test(email);
}

/**
 * `?next=` seguro (anti open-redirect, spec §5): sólo rutas INTERNAS.
 * Acepta un valor ya validado o null si no lo es; nunca lanza.
 * Reglas: string · trim · 1..512 · empieza por `/` · sin `//` ni `/\` ·
 * sin caracteres de control ni `"` ni `\` (cabeceras/JSX-hostiles).
 */
export function validarNext(next: unknown): string | null {
  if (typeof next !== "string") {
    return null;
  }
  const valor = next.trim();
  if (valor.length < 1 || valor.length > 512) {
    return null;
  }
  if (!valor.startsWith("/")) {
    return null;
  }
  // "//evil" y "/\evil" son rutas que el navegador resolve como externas.
  if (valor.startsWith("//") || valor.startsWith("/\\")) {
    return null;
  }
  if (/[\u0000-\u001f\u007f"\\]/.test(valor)) {
    return null;
  }
  return valor;
}
```

- [ ] 3. Suite completa:

```powershell
npx vitest run
# → Test  58 passed (48 intactas + 10 nuevas)
$LASTEXITCODE   # → 0
```

- [ ] 4. `npm run typecheck` → 0 · `npm run lint` → 0.

**→ Commit B2 (T2+T3):** `lib/auth/contrasena.ts`, `lib/auth/validadores.ts`, `tests/unit/auth.test.ts`.
Mensaje: `F3-B: scrypt nativo y validadores de identidad`

### T4 · Capa BD de identidad (usuarios, sesiones) + admin en la semilla

**Files:** `lib/auth/tipos.ts` (crear) · `lib/auth/base.ts` (crear) · `lib/auth/repositorio-usuarios.ts` (crear) · `lib/auth/sesiones.ts` (crear) · `tests/unit/auth.test.ts` (ampliar) · `db/seed.ts` (modificar) · `.env.local` (modificar, NO se commitea)

**Objetivo:** repositorios Drizzle de usuarios y sesiones sobre el pool propio de auth (patrón de `repositorio-postgres.ts`), y la cuenta admin idempotente en la semilla (spec §8). `sesiones.ts` es puro (`node:crypto` + drizzle vía `./base`) e **NO importa `next/headers`** — eso vive en `acceso.ts` (T5).

- [ ] 1. **Tipos del dominio.**

**Archivo nuevo `lib/auth/tipos.ts`:**

```ts
/**
 * Tipos del dominio identidad (spec F3-B §5).
 * Puro: sin imports de BD ni de next — lo consumen server y client.
 */

export type Rol = "admin" | "cliente";

/** Datos públicos de un usuario. JAMÁS incluye `passwordHash`. */
export interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  telefono: string | null;
  rol: Rol;
}

/** Sólo para verificar credenciales: queda dentro de `lib/auth`. */
export interface CredencialUsuario extends Usuario {
  passwordHash: string;
}

/** Estado que `useActionState` pasa de vuelta a los formularios. */
export interface EstadoFormulario {
  error?: string;
  campo?: "email" | "contrasena" | "nombre" | "telefono";
  ok?: string;
}
```

- [ ] 2. Test de sesiones (ROJO: `@/lib/auth/sesiones` no existe). Añade estos imports al bloque de imports de `tests/unit/auth.test.ts` y el `describe` al final del fichero:

```ts
import { createHash } from "node:crypto";
import {
  NOMBRE_COOKIE,
  OPCIONES_COOKIE_SESION,
  SEGUNDOS_SESION,
  hashearToken,
} from "@/lib/auth/sesiones";
```

```ts
describe("sesiones (token y cookie)", () => {
  it("hashearToken es SHA-256 en hex y determinista", () => {
    const token = "token-de-prueba";
    const esperado = createHash("sha256").update(token).digest("hex");
    expect(hashearToken(token)).toBe(esperado);
    expect(hashearToken(token)).toHaveLength(64);
    expect(hashearToken(`${token}1`)).not.toBe(esperado);
  });

  it("la cookie de sesión fija los atributos de la spec (§5)", () => {
    expect(NOMBRE_COOKIE).toBe("peache-sesion");
    expect(SEGUNDOS_SESION).toBe(2592000);
    expect(OPCIONES_COOKIE_SESION).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
      secure: false,
    });
  });
});
```

> Nota: importar `sesiones.ts` NO abre conexiones (el pool de `base.ts` es perezoso), así que este test sigue siendo puro y no toca la BD.

- [ ] 3. Implementa los tres módulos BD (VERDE).

**Archivo nuevo `lib/auth/base.ts`:**

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Pool perezoso PROPIO de identidad (mismo patrón que
// lib/catalogo/repositorio-postgres.ts): el catálogo y la identidad
// NO comparten pool para que un cuello de botella de uno no apague al otro.
let pool: Pool | null = null;

export function obtenerBase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL en .env.local: la tienda no puede verificar la identidad (spec F3-B §5).",
    );
  }
  pool ??= new Pool({ connectionString: url, max: 5 });
  return drizzle(pool); // el tipo se infiere: `drizzle` está sobrecargado
}
```

**Archivo nuevo `lib/auth/repositorio-usuarios.ts`:**

```ts
import { eq } from "drizzle-orm";
import { usuarios as tablaUsuarios } from "../../db/schema";
import { obtenerBase } from "./base";
import type { CredencialUsuario, Usuario } from "./tipos";

type FilaUsuario = typeof tablaUsuarios.$inferSelect;

/** Fila → dominio. `passwordHash` queda fuera de `Usuario` (spec §11). */
function aUsuario(fila: FilaUsuario): Usuario {
  return {
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    telefono: fila.telefono,
    rol: fila.rol,
  };
}

/**
 * Alta de usuario. El email debe venir ya normalizado (`normalizarEmail`).
 * Devuelve `null` si el email ya existe (conflicto UNIQUE → sin fila).
 */
export async function crearUsuario(datos: {
  email: string;
  passwordHash: string;
  nombre?: string | null;
  telefono?: string | null;
}): Promise<Usuario | null> {
  const db = obtenerBase();
  const [fila] = await db
    .insert(tablaUsuarios)
    .values({
      email: datos.email,
      passwordHash: datos.passwordHash,
      nombre: datos.nombre ?? null,
      telefono: datos.telefono ?? null,
      // el rol toma su default: 'cliente' (spec §5: nunca auto-promoción)
    })
    .onConflictDoNothing({ target: tablaUsuarios.email })
    .returning();
  return fila === undefined ? null : aUsuario(fila);
}

export async function buscarCredencialPorEmail(
  email: string,
): Promise<CredencialUsuario | null> {
  const db = obtenerBase();
  const [fila] = await db
    .select()
    .from(tablaUsuarios)
    .where(eq(tablaUsuarios.email, email))
    .limit(1);
  if (fila === undefined) {
    return null;
  }
  return { ...aUsuario(fila), passwordHash: fila.passwordHash };
}

export async function actualizarPerfilUsuario(
  id: string,
  datos: { nombre: string | null; telefono: string | null },
): Promise<Usuario | null> {
  const db = obtenerBase();
  const [fila] = await db
    .update(tablaUsuarios)
    .set({
      nombre: datos.nombre,
      telefono: datos.telefono,
      actualizadoEn: new Date(),
    })
    .where(eq(tablaUsuarios.id, id))
    .returning();
  return fila === undefined ? null : aUsuario(fila);
}
```

**Archivo nuevo `lib/auth/sesiones.ts`:**

```ts
import { createHash, randomBytes } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import {
  sesiones as tablaSesiones,
  usuarios as tablaUsuarios,
} from "../../db/schema";
import { obtenerBase } from "./base";
import type { Usuario } from "./tipos";

/**
 * Sesiones manuales (spec F3-B §4-§5): el token crudo SÓLO vive en la
 * cookie; en BD sólo su SHA-256 (una fuga de BD no otorga sesiones).
 * Puro (sin `next/headers`): lo consumen proxy, acciones y acceso.
 */

export const NOMBRE_COOKIE = "peache-sesion";
export const SEGUNDOS_SESION = 30 * 24 * 60 * 60; // 2 592 000 (30 días)

/** Atributos de la cookie (spec §5). `secure` lo fija la action (https). */
export const OPCIONES_COOKIE_SESION = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: SEGUNDOS_SESION,
  secure: false,
} as const;

export function hashearToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Crea una sesión y devuelve el token crudo (para la cookie). */
export async function crearSesion(usuarioId: string): Promise<string> {
  const db = obtenerBase();
  const ahora = new Date();
  // Limpieza oportunista de caducadas (spec §4): renovación fija, sin sliding.
  await db.delete(tablaSesiones).where(lt(tablaSesiones.expiraEn, ahora));
  const token = randomBytes(32).toString("base64url");
  await db.insert(tablaSesiones).values({
    usuarioId,
    tokenHash: hashearToken(token),
    expiraEn: new Date(ahora.getTime() + SEGUNDOS_SESION * 1000),
  });
  return token;
}

/**
 * Valida el token contra la BD: sesión vigente → usuario (sin passwordHash).
 * Caducada → borra la fila y devuelve null (spec §4).
 */
export async function buscarSesionValida(token: string): Promise<Usuario | null> {
  const db = obtenerBase();
  const tokenHash = hashearToken(token);
  const [fila] = await db
    .select({
      id: tablaUsuarios.id,
      email: tablaUsuarios.email,
      nombre: tablaUsuarios.nombre,
      telefono: tablaUsuarios.telefono,
      rol: tablaUsuarios.rol,
      expiraEn: tablaSesiones.expiraEn,
    })
    .from(tablaSesiones)
    .innerJoin(tablaUsuarios, eq(tablaSesiones.usuarioId, tablaUsuarios.id))
    .where(eq(tablaSesiones.tokenHash, tokenHash))
    .limit(1);
  if (fila === undefined) {
    return null;
  }
  if (fila.expiraEn <= new Date()) {
    await db
      .delete(tablaSesiones)
      .where(eq(tablaSesiones.tokenHash, tokenHash));
    return null;
  }
  return {
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    telefono: fila.telefono,
    rol: fila.rol,
  };
}

/** Logout = borrar la fila (spec §4). Idempotente. */
export async function borrarSesion(token: string): Promise<void> {
  const db = obtenerBase();
  await db
    .delete(tablaSesiones)
    .where(eq(tablaSesiones.tokenHash, hashearToken(token)));
}
```

- [ ] 4. Verdes los 12 unitarios:

```powershell
npx vitest run
# → Test  60 passed (48 intactas + 12 nuevas)
$LASTEXITCODE   # → 0
```

- [ ] 5. `.env.local`: añade `ADMIN_EMAIL` y `ADMIN_PASSWORD` SIN imprimir jamás los valores. Genera el password aleatorio de 24 alfanuméricos en la propia sesión y sólo muestra las CLAVES existentes:

```powershell
$alfanumericos = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
$b = New-Object byte[] 24
[System.Security.Cryptography.RandomNumberGenerator]::Fill($b)
$caracteres = for ($i = 0; $i -lt 24; $i++) { $alfanumericos[$b[$i] % $alfanumericos.Length] }
$password = -join $caracteres
[IO.File]::AppendAllText("$PWD\.env.local", "ADMIN_EMAIL=admin@peache.local`r`nADMIN_PASSWORD=$password`r`n")
Remove-Variable password, caracteres, b, alfanumericos
# Sólo las claves (NUNCA la línea con el valor):
(Select-String -Path .env.local -Pattern '^ADMIN_' | ForEach-Object { ($_.Line -split '=')[0] })
# → ADMIN_EMAIL
# → ADMIN_PASSWORD
git check-ignore .env.local
# → .env.local   (gitignored: NO se commitea jamás — nota 11)
```

> `.env.local` está en `.gitignore` desde F3-A (`env*`/`.env*`): la semilla y los E2E lo leen de forma local. Si `ADMIN_PASSWORD` ya existiera (re-ejecución), NO se regenera: se deja el valor actual.

- [ ] 6. Amplía `db/seed.ts` (spec §8). Cambia los imports:

```ts
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { categorias } from "../data/categorias";
import { productos } from "../data/productos";
import {
  categorias as tablaCategorias,
  productos as tablaProductos,
  usuarios as tablaUsuarios,
} from "./schema";
import { hashContrasena } from "../lib/auth/contrasena";
```

Y añade el bloque del admin DESPUÉS de `await db.transaction(...)` (fuera de la transacción del catálogo) y el recuento de administradores antes del `console.log` final; el log final pasa a incluir administradores:

```ts
    // Cuenta admin (spec F3-B §8): upsert desde ADMIN_EMAIL/ADMIN_PASSWORD.
    // NUNCA borra usuarios ni sesiones; una cuenta preexistente con ese
    // email queda promovida y con la contraseña vigente.
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const passwordHash = await hashContrasena(adminPassword);
      await db
        .insert(tablaUsuarios)
        .values({
          email: adminEmail,
          passwordHash,
          nombre: "Administrador",
          rol: "admin",
        })
        .onConflictDoUpdate({
          target: tablaUsuarios.email,
          // Sólo password_hash y rol (spec §8 literal): nombre y telefono
          // de la cuenta preexistente se conservan.
          set: { passwordHash, rol: "admin", actualizadoEn: new Date() },
        });
      console.log(`✓ Cuenta admin: ${adminEmail}`); // sin la contraseña
    } else {
      console.warn(
        "⚠ Semilla: faltan ADMIN_EMAIL o ADMIN_PASSWORD en .env.local — no se crea la cuenta admin (spec F3-B §8).",
      );
    }

    const [totalAdministradores] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tablaUsuarios)
      .where(eq(tablaUsuarios.rol, "admin"));

    console.log(
      `✓ Semilla aplicada: ${totalProductos.n} productos, ${totalCategorias.n} categorías y ${totalAdministradores.n} administrador(es).`,
    );
```

- [ ] 7. **Evidencia: semilla ×2 + conteo psql** (guardar salidas literales):

```powershell
npm run db:seed
# → ✓ Cuenta admin: admin@peache.local
# → ✓ Semilla aplicada: 14 productos, 3 categorías y 1 administrador(es).
npm run db:seed
# → MISMA salida (idempotente): la segunda ejecución no duplica admin ni borra sesiones
$LASTEXITCODE   # → 0
$psql = (Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" | Sort-Object FullName -Descending | Select-Object -First 1).FullName
& $psql -U postgres -d peache -c "SELECT rol, count(*) FROM usuarios GROUP BY rol;"
# → rol    | count
#  --------+-------
#  admin   |      1
```

- [ ] 8. `npm run typecheck` → 0 · `npm run lint` → 0 · `npx vitest run` → 60 passed.

**→ Commit B3:** `lib/auth/tipos.ts`, `lib/auth/base.ts`, `lib/auth/repositorio-usuarios.ts`, `lib/auth/sesiones.ts`, `db/seed.ts`, `tests/unit/auth.test.ts` (`.env.local` NO).
Mensaje: `F3-B: repositorios de usuarios y sesiones, admin en semilla`

### T5 · Login y cierre de sesión (server actions)

**Files:** `components/ui/CampoTexto.tsx` (modificar) · `lib/auth/acceso.ts` (crear) · `lib/auth/acciones.ts` (crear) · `components/auth/FormularioAuth.module.css` (crear) · `components/auth/FormularioLogin.tsx` (crear) · `app/login/page.tsx` (crear)

**Objetivo:** HU-11 + HU-12. Primeras server actions del repo: `iniciarSesion` y `cerrarSesion`, con `useActionState`, error inline y botón pending. Mensaje de login **genérico** («Email o contraseña incorrectos.») y coste de timing uniforme (spec §11).

- [ ] 1. `CampoTexto`: extiende la unión de `tipo` con `"password"` (cambio aditivo de UNA línea — los formularios de login/registro lo necesitan y el componente es el dueño de su `<input>`):

```ts
  tipo?: "search" | "text" | "email" | "tel" | "number" | "password";
```

- [ ] 2. **Capa cookies de Next** (la única que importa `next/headers` para leer):

**Archivo nuevo `lib/auth/acceso.ts`:**

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NOMBRE_COOKIE, buscarSesionValida } from "./sesiones";
import type { Usuario } from "./tipos";

/**
 * Helpers de sesión para Server Components (spec F3-B §5):
 * cookie → SHA-256 → sesión vigente → usuario. Sin cookie NO se toca la BD.
 */

export async function obtenerSesionActual(): Promise<Usuario | null> {
  const almacenamiento = await cookies();
  const token = almacenamiento.get(NOMBRE_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return buscarSesionValida(token);
}

/** Defensa en profundidad (spec §6): sin sesión admin → /login. */
export async function requerirAdmin(): Promise<Usuario> {
  const usuario = await obtenerSesionActual();
  if (!usuario || usuario.rol !== "admin") {
    redirect("/login?next=/dashboard");
  }
  return usuario;
}
```

- [ ] 3. **Server actions** (login + logout; registro y perfil se añaden en T6/T7):

**Archivo nuevo `lib/auth/acciones.ts`:**

```ts
"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  hashContrasena,
  longitudClaveValida,
  verificarContrasena,
} from "./contrasena";
import {
  buscarCredencialPorEmail,
  crearUsuario,
  actualizarPerfilUsuario,
} from "./repositorio-usuarios";
import {
  NOMBRE_COOKIE,
  OPCIONES_COOKIE_SESION,
  borrarSesion,
  buscarSesionValida,
  crearSesion,
} from "./sesiones";
import { emailValido, normalizarEmail, validarNext } from "./validadores";
import type { EstadoFormulario } from "./tipos";

/**
 * Server actions de identidad (spec F3-B §5). PRIMERA server action del repo:
 * el archivo entero es `"use server"`, así que sólo se exportan async.
 * `redirect()` lanza internamente: nunca se ejecuta código tras él.
 */

/** Fija la cookie de sesión; `secure` según el protocolo de la URL (spec §5). */
async function fijarCookieSesion(token: string): Promise<void> {
  const almacenamiento = await cookies();
  const esHttps = (await headers()).get("x-forwarded-proto") === "https";
  almacenamiento.set(NOMBRE_COOKIE, token, {
    ...OPCIONES_COOKIE_SESION,
    secure: esHttps,
  });
}

export async function iniciarSesion(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = normalizarEmail(String(formData.get("email") ?? ""));
  const contrasena = String(formData.get("contrasena") ?? "");
  const next = validarNext(formData.get("next"));

  if (!emailValido(email)) {
    return { error: "Introduce un email válido.", campo: "email" };
  }
  if (contrasena.length === 0) {
    return { error: "Introduce tu contraseña.", campo: "contrasena" };
  }

  const credencial = await buscarCredencialPorEmail(email);
  if (!credencial) {
    // Coste de timing uniforme (spec §11): si el email no existe se ejecuta
    // igualmente un hash DESCARTADO, para que el tiempo de respuesta no
    // revele qué emails tienen cuenta.
    await hashContrasena(contrasena);
    return { error: "Email o contraseña incorrectos." };
  }

  const coincide = await verificarContrasena(contrasena, credencial.passwordHash);
  if (!coincide) {
    // Mensaje GENÉRICO: no revela si el email existe (spec §5, §11).
    return { error: "Email o contraseña incorrectos." };
  }

  const token = await crearSesion(credencial.id);
  await fijarCookieSesion(token);
  // Destino: ?next= validado si existe; si no, admin → /dashboard, resto → /.
  redirect(next ?? (credencial.rol === "admin" ? "/dashboard" : "/"));
}

export async function cerrarSesion(): Promise<void> {
  const almacenamiento = await cookies();
  const token = almacenamiento.get(NOMBRE_COOKIE)?.value;
  if (token) {
    await borrarSesion(token); // HU-12: borra la fila + la cookie
  }
  almacenamiento.delete(NOMBRE_COOKIE);
  redirect("/");
}
```

- [ ] 4. **CSS module compartido** de los 3 formularios de identidad. Justificación documentada (excepción a la regla 1:1 del repo): los tres formularios tienen idéntica anatomía (columna de campos + error general `role="alert"` + éxito `role="status"`), así que DRY manda una sola copia en `FormularioAuth.module.css`.

**Archivo nuevo `components/auth/FormularioAuth.module.css`:**

```css
/* F3-B — estilos compartidos de los 3 formularios de identidad
   (login, registro, perfil). Misma anatomía => una sola copia (DRY).
   Sólo tokens de globals.css, claro y oscuro resueltos por las variables. */

.formulario {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.errorFormulario {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: var(--border-width) solid var(--color-error);
  border-radius: var(--radius);
  background-color: var(--color-error-bg);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body);
}

.exito {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: var(--border-width) solid var(--color-success);
  border-radius: var(--radius);
  background-color: var(--color-success-bg);
  color: var(--color-success);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body);
}
```

- [ ] 5. **Formulario cliente** del login:

**Archivo nuevo `components/auth/FormularioLogin.tsx`:**

```tsx
"use client";

import { useActionState } from "react";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { iniciarSesion } from "@/lib/auth/acciones";
import styles from "./FormularioAuth.module.css";

export interface FormularioLoginProps {
  /** Ruta interna ya validada (`validarNext`) que se conserva tras el login. */
  next?: string;
}

export default function FormularioLogin({ next }: FormularioLoginProps) {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, null);

  return (
    <form action={accion} className={styles.formulario}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <CampoTexto
        etiqueta="Email"
        id="login-email"
        tipo="email"
        name="email"
        autoComplete="email"
        required
        error={estado?.campo === "email" ? estado.error : undefined}
      />
      <CampoTexto
        etiqueta="Contraseña"
        id="login-contrasena"
        tipo="password"
        name="contrasena"
        autoComplete="current-password"
        required
        error={estado?.campo === "contrasena" ? estado.error : undefined}
      />
      {estado?.error && !estado.campo ? (
        <p role="alert" className={styles.errorFormulario}>
          {estado.error}
        </p>
      ) : null}
      <Boton type="submit" loading={pendiente}>
        Iniciar sesión
      </Boton>
    </form>
  );
}
```

- [ ] 6. **Página** `/login` (server; `searchParams` es una Promise en Next 16):

**Archivo nuevo `app/login/page.tsx`:**

```tsx
import type { Metadata } from "next";
import Contenedor from "@/components/ui/Contenedor";
import Enlace from "@/components/ui/Enlace";
import FormularioLogin from "@/components/auth/FormularioLogin";
import { validarNext } from "@/lib/auth/validadores";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Inicia sesión en tu cuenta de Peache Perfumes.",
};

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; aviso?: string }>;
}) {
  const parametros = await searchParams;
  // `?next=` se valida SIEMPRE (anti open-redirect, spec §5/§6).
  const next = validarNext(parametros.next) ?? undefined;

  return (
    <Contenedor ancho="estrecho">
      <h1>Iniciar sesión</h1>
      {parametros.aviso === "expirada" ? (
        <p role="status">Tu sesión ha caducado. Inicia sesión de nuevo.</p>
      ) : null}
      <FormularioLogin next={next} />
      <p>
        ¿Aún no tienes cuenta?{" "}
        <Enlace
          href={next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"}
        >
          Crear cuenta
        </Enlace>
      </p>
    </Contenedor>
  );
}
```

- [ ] 7. Verificación: `npm run typecheck` → 0 · `npm run lint` → 0 · `npx vitest run` → 60 passed (sin cambios) · `npm run build` → 0.

> El E2E del login se consolida en T11 (compromiso de pruebas: cada Playwright obliga a build+start fresco).

**→ Commit B4:** `components/ui/CampoTexto.tsx`, `lib/auth/acceso.ts`, `lib/auth/acciones.ts`, `components/auth/FormularioAuth.module.css`, `components/auth/FormularioLogin.tsx`, `app/login/page.tsx`.
Mensaje: `F3-B: login y cierre de sesion con server actions`

### T6 · Registro con auto-login

**Files:** `lib/auth/acciones.ts` (ampliar) · `components/auth/FormularioRegistro.tsx` (crear) · `app/registro/page.tsx` (crear)

**Objetivo:** HU-10. Registro email+contraseña (rol SIEMPRE `cliente`), email duplicado inline, y auto-login inmediato tras registrarse.

- [ ] 1. Añade `registrarUsuario` a `lib/auth/acciones.ts` (tras `iniciarSesion`, antes de `cerrarSesion` — el helper `crearUsuario` ya está importado desde T5):

```ts
export async function registrarUsuario(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = normalizarEmail(String(formData.get("email") ?? ""));
  const contrasena = String(formData.get("contrasena") ?? "");
  const next = validarNext(formData.get("next"));

  if (!emailValido(email)) {
    return { error: "Introduce un email válido.", campo: "email" };
  }
  if (!longitudClaveValida(contrasena)) {
    return {
      error: "La contraseña debe tener entre 8 y 128 caracteres.",
      campo: "contrasena",
    };
  }

  const passwordHash = await hashContrasena(contrasena);
  // Rol SIEMPRE cliente: `crearUsuario` no acepta rol (spec §5: sin auto-promoción).
  const usuario = await crearUsuario({ email, passwordHash });
  if (!usuario) {
    return { error: "Ese email ya tiene una cuenta. Inicia sesión.", campo: "email" };
  }

  // Auto-login tras registrarse (spec §7).
  const token = await crearSesion(usuario.id);
  await fijarCookieSesion(token);
  redirect(next ?? "/");
}
```

- [ ] 2. **Formulario** (misma anatomía que el login; `ayuda` en contraseña, microcopy literal del spec §7):

**Archivo nuevo `components/auth/FormularioRegistro.tsx`:**

```tsx
"use client";

import { useActionState } from "react";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { registrarUsuario } from "@/lib/auth/acciones";
import styles from "./FormularioAuth.module.css";

export interface FormularioRegistroProps {
  /** Ruta interna ya validada (`validarNext`) que se conserva tras el registro. */
  next?: string;
}

export default function FormularioRegistro({ next }: FormularioRegistroProps) {
  const [estado, accion, pendiente] = useActionState(registrarUsuario, null);

  return (
    <form action={accion} className={styles.formulario}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <CampoTexto
        etiqueta="Email"
        id="registro-email"
        tipo="email"
        name="email"
        autoComplete="email"
        required
        error={estado?.campo === "email" ? estado.error : undefined}
      />
      <CampoTexto
        etiqueta="Contraseña"
        id="registro-contrasena"
        tipo="password"
        name="contrasena"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        ayuda="Mínimo 8 caracteres."
        error={estado?.campo === "contrasena" ? estado.error : undefined}
      />
      {estado?.error && !estado.campo ? (
        <p role="alert" className={styles.errorFormulario}>
          {estado.error}
        </p>
      ) : null}
      <Boton type="submit" loading={pendiente}>
        Crear cuenta
      </Boton>
    </form>
  );
}
```

- [ ] 3. **Página** `/registro`:

**Archivo nuevo `app/registro/page.tsx`:**

```tsx
import type { Metadata } from "next";
import Contenedor from "@/components/ui/Contenedor";
import Enlace from "@/components/ui/Enlace";
import FormularioRegistro from "@/components/auth/FormularioRegistro";
import { validarNext } from "@/lib/auth/validadores";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta de Peache Perfumes.",
};

export default async function PaginaRegistro({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const parametros = await searchParams;
  const next = validarNext(parametros.next) ?? undefined;

  return (
    <Contenedor ancho="estrecho">
      <h1>Crear cuenta</h1>
      <FormularioRegistro next={next} />
      <p>
        ¿Ya tienes cuenta?{" "}
        <Enlace
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        >
          Iniciar sesión
        </Enlace>
      </p>
    </Contenedor>
  );
}
```

- [ ] 4. Verificación: `npm run typecheck` → 0 · `npm run lint` → 0 · `npx vitest run` → 60 passed · `npm run build` → 0.

**→ Commit B5:** `lib/auth/acciones.ts`, `components/auth/FormularioRegistro.tsx`, `app/registro/page.tsx`.
Mensaje: `F3-B: registro de cuentas`

### T7 · Perfil editable (nombre y teléfono/WhatsApp)

**Files:** `lib/auth/acciones.ts` (ampliar) · `components/auth/FormularioPerfil.tsx` (crear) · `app/perfil/page.tsx` (crear)

**Objetivo:** HU-15. `/perfil` con sesión obligatoria; email visible SOLO lectura; nombre (≤80) y teléfono (≤30) editables; confirmación «Cambios guardados.».

- [ ] 1. Añade `actualizarPerfil` a `lib/auth/acciones.ts` (al final del fichero; `actualizarPerfilUsuario` ya está importado desde T5):

```ts
export async function actualizarPerfil(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const almacenamiento = await cookies();
  const token = almacenamiento.get(NOMBRE_COOKIE)?.value;
  const usuario = token ? await buscarSesionValida(token) : null;
  if (!usuario) {
    // La sesión caducó mientras el usuario editaba: a login con aviso.
    redirect("/login?next=/perfil&aviso=expirada");
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();

  if (nombre.length > 80) {
    return { error: "El nombre no puede superar 80 caracteres.", campo: "nombre" };
  }
  if (telefono.length > 30) {
    return {
      error: "El teléfono no puede superar 30 caracteres.",
      campo: "telefono",
    };
  }

  const actualizado = await actualizarPerfilUsuario(usuario.id, {
    nombre: nombre === "" ? null : nombre,
    telefono: telefono === "" ? null : telefono,
  });
  if (!actualizado) {
    // Sin fallback (nota 13): se dice el fallo, no se inventan datos.
    return { error: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }
  return { ok: "Cambios guardados." };
}
```

- [ ] 2. **Formulario** (recibe email/nombre/teléfono como props para pintar los `defaultValue`; el email se renderiza aquí DENTRO del formulario pero `readOnly`, para que la anatomía y el espaciado sean los de `.formulario`):

**Archivo nuevo `components/auth/FormularioPerfil.tsx`:**

```tsx
"use client";

import { useActionState } from "react";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { actualizarPerfil } from "@/lib/auth/acciones";
import styles from "./FormularioAuth.module.css";

export interface FormularioPerfilProps {
  email: string;
  nombre: string | null;
  telefono: string | null;
}

export default function FormularioPerfil({
  email,
  nombre,
  telefono,
}: FormularioPerfilProps) {
  const [estado, accion, pendiente] = useActionState(actualizarPerfil, null);

  return (
    <form action={accion} className={styles.formulario}>
      {/* Email sólo lectura (spec §7): el cambio de email no está en F3-B. */}
      <CampoTexto
        etiqueta="Email"
        id="perfil-email"
        tipo="email"
        name="email"
        defaultValue={email}
        readOnly
        autoComplete="email"
      />
      <CampoTexto
        etiqueta="Nombre"
        id="perfil-nombre"
        tipo="text"
        name="nombre"
        defaultValue={nombre ?? ""}
        maxLength={80}
        autoComplete="name"
        error={estado?.campo === "nombre" ? estado.error : undefined}
      />
      <CampoTexto
        etiqueta="Teléfono (WhatsApp)"
        id="perfil-telefono"
        tipo="tel"
        name="telefono"
        defaultValue={telefono ?? ""}
        maxLength={30}
        autoComplete="tel"
        error={estado?.campo === "telefono" ? estado.error : undefined}
      />
      {estado?.error && !estado.campo ? (
        <p role="alert" className={styles.errorFormulario}>
          {estado.error}
        </p>
      ) : null}
      {estado?.ok ? (
        <p role="status" className={styles.exito}>
          {estado.ok}
        </p>
      ) : null}
      <Boton type="submit" loading={pendiente}>
        Guardar cambios
      </Boton>
    </form>
  );
}
```

- [ ] 3. **Página** `/perfil` (guard de sesión; distingue «sin sesión» de «sesión caducada/inválida» para el aviso HU-14):

**Archivo nuevo `app/perfil/page.tsx`:**

```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Contenedor from "@/components/ui/Contenedor";
import FormularioPerfil from "@/components/auth/FormularioPerfil";
import { obtenerSesionActual } from "@/lib/auth/acceso";
import { NOMBRE_COOKIE } from "@/lib/auth/sesiones";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Tu perfil de Peache Perfumes: nombre y teléfono.",
};

export default async function PaginaPerfil() {
  const usuario = await obtenerSesionActual();
  if (!usuario) {
    // ¿Había cookie? Entonces la sesión caducó o su token ya no vale:
    // se llega a /login con el aviso «Tu sesión ha caducado.» (HU-14).
    const almacenamiento = await cookies();
    const habiaCookie = Boolean(almacenamiento.get(NOMBRE_COOKIE)?.value);
    redirect(
      habiaCookie
        ? "/login?next=/perfil&aviso=expirada"
        : "/login?next=/perfil",
    );
  }

  return (
    <Contenedor ancho="estrecho">
      <h1>Mi perfil</h1>
      <FormularioPerfil
        email={usuario.email}
        nombre={usuario.nombre}
        telefono={usuario.telefono}
      />
    </Contenedor>
  );
}
```

- [ ] 4. Verificación: `npm run typecheck` → 0 · `npm run lint` → 0 · `npx vitest run` → 60 passed · `npm run build` → 0.

**→ Commit B6:** `lib/auth/acciones.ts`, `components/auth/FormularioPerfil.tsx`, `app/perfil/page.tsx`.
Mensaje: `F3-B: perfil editable (nombre y telefono)`

### T8 · `proxy.ts` + página 403 real

**Files:** `lib/auth/pagina-403.ts` (crear) · `proxy.ts` (crear, en la RAÍZ)

**Objetivo:** HU-17. `/dashboard/*` responde **403 real** (status HTTP + página propia) a todo lo que no sea admin, vía el guard de Next 16 (verificado en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`: `middleware` está deprecado y renombrado a `proxy`, corre por defecto en **runtime Node.js** y puede producir respuestas con status arbitrario).

- [ ] 1. **HTML autocontenido** (no pasa por React; estilos con los tokens hex de `globals.css` + `prefers-color-scheme`; microcopy literal del spec §6):

**Archivo nuevo `lib/auth/pagina-403.ts`:**

```ts
/**
 * Página 403 autocontenida del proxy (spec F3-B §6): HTML mínimo sin
 * pasar por React. Estilos inline con los tokens de `app/globals.css`
 * (claro + `prefers-color-scheme: dark`), tipografía de sistema (D10:
 * sin webfonts), contraste AA y foco visible.
 */
export function pagina403(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>403 — no autorizado · Peache Perfumes</title>
<style>
  :root {
    color-scheme: light;
    --bg: #faf8f6; --surface: #ffffff; --text: #1b1714; --muted: #5c554e;
    --border: #e7e2dc; --accent: #b0485c; --on-accent: #ffffff;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --bg: #16130f; --surface: #1e1a17; --text: #f2eee8; --muted: #aba299;
      --border: #332e29; --accent: #e79aa8; --on-accent: #241a1d;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center;
    justify-content: center; padding: 16px; background: var(--bg);
    color: var(--text); line-height: 1.6;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
  }
  main {
    max-width: 42rem; padding: 32px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 4px; text-align: center;
  }
  h1 {
    margin: 0 0 8px; font-size: 2rem; line-height: 1.2;
    font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
  }
  p { margin: 0 0 24px; color: var(--muted); }
  .acciones { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
  a {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 44px; padding: 0 24px; border-radius: 4px;
    font-weight: 600; text-decoration: none;
  }
  a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  a.primario { background: var(--accent); color: var(--on-accent); }
  a.secundario { color: var(--accent); border: 1px solid var(--border); }
</style>
</head>
<body>
<main>
  <h1>403 — no autorizado</h1>
  <p>Sólo el administrador puede acceder a esta zona.</p>
  <div class="acciones">
    <a class="primario" href="/login?next=/dashboard">Iniciar sesión</a>
    <a class="secundario" href="/">Volver a la tienda</a>
  </div>
</main>
</body>
</html>`;
}
```

- [ ] 2. **El guard** (en la RAÍZ del proyecto; `eslint .` lo revisa):

**Archivo nuevo `proxy.ts`:**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pagina403 } from "@/lib/auth/pagina-403";
import { NOMBRE_COOKIE, buscarSesionValida } from "@/lib/auth/sesiones";

/**
 * Guard de `/dashboard` (spec F3-B §6). Fuente: node_modules/next/dist/docs/
 * 01-app/03-api-reference/03-file-conventions/proxy.md — `middleware` está
 * deprecado en Next 16 y renombrado a `proxy.ts`; corre por defecto en
 * runtime Node.js (puede consultar la BD) y puede responder con status
 * arbitrario. NO existe `middleware.ts` en este repo.
 *
 * El pool de `lib/auth/base.ts` es perezoso: sin cookie NO se toca la BD
 * (short-circuit), así que la tienda pública no paga coste de auth.
 */
export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(NOMBRE_COOKIE)?.value;

  if (!token) {
    return new Response(pagina403(), {
      status: 403,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const usuario = await buscarSesionValida(token);
  if (!usuario || usuario.rol !== "admin") {
    // Sesión inválida, caducada o de un cliente: mismo 403 (sin matices).
    return new Response(pagina403(), {
      status: 403,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Sólo /dashboard: ni assets ni el resto de la tienda (spec §6).
  matcher: ["/dashboard/:path*"],
};
```

> `"/dashboard/:path*"` también cubre `/dashboard` a secas (`*` = cero o más segmentos).

- [ ] 3. Verificación estática: `npm run typecheck` → 0 · `npm run lint` → 0 · `npx vitest run` → 60 passed.

- [ ] 4. **Evidencia funcional con `next start` + curl** (en este punto `app/dashboard/` aún NO existe, pero el 403 se produce ANTES del routing: el proxy responde directo). Puerto 3000 libre:

```powershell
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
  Write-Output "OCUPADO: para el servidor previo o usa otro puerto"
} else {
  Write-Output "LIBRE"
}
npm run build
$LASTEXITCODE   # → 0
$proceso = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run start" -PassThru -WindowStyle Hidden
$intentos = 0; $codigo = "000"
do {
  Start-Sleep -Seconds 2
  $codigo = curl.exe -s -o $null -w "%{http_code}" http://localhost:3000/catalogo
  $intentos++
} until ($codigo -eq "200" -or $intentos -ge 30)
Write-Output "health /catalogo -> $codigo"   # → 200

curl.exe -s -i http://localhost:3000/dashboard | Select-String -Pattern "HTTP/1.1 403"
# → HTTP/1.1 403
curl.exe -s http://localhost:3000/dashboard | Select-String -Pattern "403 — no autorizado|Sólo el administrador"
# → <h1>403 — no autorizado</h1>
# → <p>Sólo el administrador puede acceder a esta zona.</p>
curl.exe -s -o $null -w "%{http_code}`n" http://localhost:3000/dashboard/productos
# → 403   (el matcher cubre /dashboard/:path*)
curl.exe -s -o $null -w "%{http_code}`n" http://localhost:3000/catalogo
# → 200   (el matcher NO toca el resto de la tienda)
# Parar el servidor: se mata al dueño del puerto 3000 (node), no al wrapper cmd.
$pid3000 = (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess
Stop-Process -Id $pid3000 -Force
```

**→ Commit B7:** `lib/auth/pagina-403.ts`, `proxy.ts`.
Mensaje: `F3-B: proxy de /dashboard con 403 real`

### T9 · Dashboard: re-verificación + bienvenida + índice

**Files:** `app/dashboard/layout.tsx` (crear) · `app/dashboard/page.tsx` (crear) · `components/dashboard/IndiceSecciones.tsx` (crear) · `components/dashboard/IndiceSecciones.module.css` (crear)

**Objetivo:** HU-16/17. El layout re-verifica al admin (defensa en profundidad, spec §6) y la página muestra la tarjeta de bienvenida + el índice de secciones como tiles **informativos** «Próximamente» (spec §7: sin botones muertos, sin contadores inventados).

- [ ] 1. **Layout con re-verificación** (si el proxy pasó pero la sesión caducó entre ambos → redirect a `/login`):

**Archivo nuevo `app/dashboard/layout.tsx`:**

```tsx
import type { ReactNode } from "react";
import Contenedor from "@/components/ui/Contenedor";
import { requerirAdmin } from "@/lib/auth/acceso";

/**
 * Defensa en profundidad (spec F3-B §6): `proxy.ts` ya filtra por rol,
 * pero el layout re-verifica con la sesión REAL de la BD — si caducó
 * entre ambas capas, `requerirAdmin` redirige a /login.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requerirAdmin();
  return <Contenedor>{children}</Contenedor>;
}
```

- [ ] 2. **Página** de bienvenida:

**Archivo nuevo `app/dashboard/page.tsx`:**

```tsx
import type { Metadata } from "next";
import IndiceSecciones from "@/components/dashboard/IndiceSecciones";
import { obtenerSesionActual } from "@/lib/auth/acceso";

export const metadata: Metadata = {
  title: "Panel de administración",
  description: "Panel de administración de Peache Perfumes.",
  robots: { index: false }, // zona privada: sin indexación
};

export default async function PaginaDashboard() {
  const usuario = await obtenerSesionActual();
  // El layout ya exigió admin; este guard evita `usuario!.email` si algo cambia.
  if (!usuario) {
    return null;
  }

  return (
    <>
      <h1>Panel de administración</h1>
      <p>Sesión iniciada como {usuario.email}.</p>
      <p>Desde aquí gestionarás la tienda de Peache Perfumes.</p>
      <IndiceSecciones />
    </>
  );
}
```

- [ ] 3. **Índice de secciones** (tiles informativos, NO enlaces):

**Archivo nuevo `components/dashboard/IndiceSecciones.tsx`:**

```tsx
import styles from "./IndiceSecciones.module.css";

/**
 * Índice del dashboard (spec F3-B §7): tiles INFORMATIVOS con «Próximamente»
 * — NO son enlaces. Las secciones llegan en F3-C (Productos), F3-D (Pedidos)
 * y F3-E (Reportes); no se prometen rutas muertas.
 */
const SECCIONES = [
  { titulo: "Productos", descripcion: "Catálogo, estados y stock.", bloque: "F3-C" },
  { titulo: "Pedidos", descripcion: "Lista, detalle y estados.", bloque: "F3-D" },
  { titulo: "Reportes", descripcion: "Ventas y economía de la tienda.", bloque: "F3-E" },
];

export default function IndiceSecciones() {
  return (
    <section className={styles.indice} aria-labelledby="titulo-indice">
      <h2 id="titulo-indice">Secciones</h2>
      <ul className={styles.lista}>
        {SECCIONES.map(({ titulo, descripcion, bloque }) => (
          <li key={titulo} className={styles.tarjeta}>
            <h3>{titulo}</h3>
            <p>{descripcion}</p>
            <p className={styles.proximamente}>Próximamente · {bloque}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

**Archivo nuevo `components/dashboard/IndiceSecciones.module.css`:**

```css
/* F3-B — índice de secciones del dashboard. Sólo tokens. */

.indice {
  margin-top: var(--space-6);
}

.lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-4);
  margin: var(--space-4) 0 0;
  padding: 0;
  list-style: none;
}

.tarjeta {
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius);
}

.tarjeta h3 {
  margin: 0 0 var(--space-2);
}

.tarjeta p {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.proximamente {
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent);
}
```

- [ ] 4. Verificación: `npm run typecheck` → 0 · `npm run lint` → 0 · `npm run build` → 0 (el build también prueba que el layout del dashboard compila).

**→ Commit B8:** `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `components/dashboard/IndiceSecciones.tsx`, `components/dashboard/IndiceSecciones.module.css`.
Mensaje: `F3-B: dashboard protegido con bienvenida e indice`

### T10 · Navbar según el estado de sesión

**Files:** `components/layout/CuentaAcciones.tsx` (crear) · `components/layout/CuentaAcciones.module.css` (crear) · `components/layout/Cabecera.tsx` (modificar) · `app/layout.tsx` (modificar)

**Objetivo:** la navbar muestra «Iniciar sesión»/«Crear cuenta» al invitado, «Mi perfil»/«Cerrar sesión» con sesión, y «Dashboard» además al admin (spec §7). `Cabecera` recibe la cuenta por prop; el layout raíz pasa a `async` y lee la sesión.

> **Advertencia esperada (nota 12 / D-F3B-DINAMICO):** leer la sesión en `app/layout.tsx` convierte TODAS las rutas en dinámicas (ƒ) en `next build`. Es correcto: la navbar necesita estado y el rendimiento local es suficiente. El gate sigue siendo `npm run build` → exit 0.

- [ ] 1. **Componente cliente** de acciones de cuenta:

**Archivo nuevo `components/layout/CuentaAcciones.tsx`:**

```tsx
"use client";

import Enlace from "@/components/ui/Enlace";
import { cerrarSesion } from "@/lib/auth/acciones";
import type { Rol } from "@/lib/auth/tipos";
import styles from "./CuentaAcciones.module.css";

/** Lo mínimo que la navbar necesita saber de la cuenta (serializable). */
export interface CuentaCabecera {
  nombre: string | null;
  email: string;
  rol: Rol;
}

export interface CuentaAccionesProps {
  cuenta: CuentaCabecera | null;
  orientacion?: "horizontal" | "vertical";
  /** En el menú móvil: cierra la hoja antes de navegar (§5). */
  onNavegar?: () => void;
}

/**
 * Acciones de cuenta de la navbar (spec F3-B §7):
 * invitado → «Iniciar sesión» · «Crear cuenta»;
 * con sesión → «Mi perfil» · «Cerrar sesión»; admin → además «Dashboard».
 */
export default function CuentaAcciones({
  cuenta,
  orientacion = "horizontal",
  onNavegar,
}: CuentaAccionesProps) {
  const clases = [styles.cuenta, styles[`cuenta--${orientacion}`]]
    .filter(Boolean)
    .join(" ");

  return (
    <nav aria-label="Cuenta" className={clases}>
      <ul className={styles.lista}>
        {cuenta === null ? (
          <>
            <li>
              <Enlace href="/login" onClick={onNavegar}>
                Iniciar sesión
              </Enlace>
            </li>
            <li>
              <Enlace href="/registro" onClick={onNavegar}>
                Crear cuenta
              </Enlace>
            </li>
          </>
        ) : (
          <>
            <li>
              <Enlace href="/perfil" onClick={onNavegar}>
                Mi perfil
              </Enlace>
            </li>
            {cuenta.rol === "admin" ? (
              <li>
                <Enlace href="/dashboard" onClick={onNavegar}>
                  Dashboard
                </Enlace>
              </li>
            ) : null}
            <li>
              {/* Logout por server action (HU-12): borra fila + cookie. */}
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className={styles.cerrar}
                  onClick={onNavegar}
                >
                  Cerrar sesión
                </button>
              </form>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
```

**Archivo nuevo `components/layout/CuentaAcciones.module.css`:**

```css
/* F3-B — acciones de cuenta en la navbar. Patrón de Cabecera.module.css:
   el horizontal se oculta bajo 768px (sólo vive en .acciones junto al
   conmutador de tema); el vertical es la hoja del menú móvil. */

.cuenta--horizontal {
  display: none;
}

@media (min-width: 768px) {
  .cuenta--horizontal {
    display: flex;
  }
}

.cuenta--vertical {
  padding-block: var(--space-3);
  margin-top: var(--space-3);
  border-top: var(--border-width) solid var(--color-border);
}

.lista {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.cuenta--vertical .lista {
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-2);
}

.cerrar {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  padding-inline: var(--space-3);
  background: transparent;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-in-out);
}

.cerrar:hover {
  background-color: var(--color-surface-alt);
}
```

- [ ] 2. **`Cabecera.tsx`** (modificar): importa `CuentaAcciones` y su tipo, recibe `cuenta` y monta las dos variantes. Cambios exactos:

  - Añade imports:

    ```tsx
    import CuentaAcciones, {
      type CuentaCabecera,
    } from "@/components/layout/CuentaAcciones";
    ```

  - Firma:

    ```tsx
    export default function Cabecera({
      cuenta,
    }: {
      cuenta?: CuentaCabecera | null;
    }) {
    ```

  - Dentro de `.acciones` (`<div className={styles.acciones}>`), ANTES de `<ConmutadorTema />`:

    ```tsx
          <CuentaAcciones cuenta={cuenta ?? null} orientacion="horizontal" />
    ```

  - Dentro del `HojaModal` del menú móvil (`id="menu-movil"`), DESPUÉS de `<Navegacion …>`:

    ```tsx
          <CuentaAcciones
            cuenta={cuenta ?? null}
            orientacion="vertical"
            onNavegar={() => setMenuAbierto(false)}
          />
    ```

- [ ] 3. **`app/layout.tsx`** (modificar): pasa a `async` y lee la sesión. Cambios exactos:

  - Añade import:

    ```tsx
    import { obtenerSesionActual } from "@/lib/auth/acceso";
    ```

  - Firma y cuerpo:

    ```tsx
    export default async function RootLayout({
      children,
    }: Readonly<{ children: ReactNode }>) {
      // La navbar necesita el estado de cuenta (spec F3-B §7): esto convierte
      // TODAS las rutas en dinámicas (ƒ) en el build — esperado (D-F3B-DINAMICO).
      const usuario = await obtenerSesionActual();
      const cuenta = usuario
        ? { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
        : null;
    ```

  - `<Cabecera />` → `<Cabecera cuenta={cuenta} />`.

- [ ] 4. Verificación: `npm run typecheck` → 0 · `npm run lint` → 0 · `npx vitest run` → 60 passed.

- [ ] 5. Evidencia de build (las rutas pasan a ƒ — ESPERADO):

```powershell
npm run build
$LASTEXITCODE   # → 0 (el gate es exit 0, no la marca de las rutas)
# En la tabla de rutas: /, /catalogo, /login, /registro, /perfil, /dashboard
# aparecen con ƒ (Server-Side Rendered en request) — decision D-F3B-DINAMICO.
```

**→ Commit B9:** `components/layout/CuentaAcciones.tsx`, `components/layout/CuentaAcciones.module.css`, `components/layout/Cabecera.tsx`, `app/layout.tsx`.
Mensaje: `F3-B: navbar segun el estado de sesion`

### T11 · E2E consolidado de identidad

**Files:** `playwright.config.ts` (modificar) · `tests/identidad.spec.ts` (crear)

**Objetivo:** los 11 E2E nuevos de la spec §9 con el microcopy literal. **Los 19 E2E existentes y `tests/accesibilidad.spec.ts` NO se tocan** (quedan intactos al pie de la letra).

**Prerrequisito:** `.env.local` con `ADMIN_EMAIL`/`ADMIN_PASSWORD` (T4) — si faltan, el test (e) se salta con aviso visible y el gate de T13 contaría «1 skipped»; T13 exige los 30 en verde, así que antes de ejecutar verifica que las CLAVES existen (sin imprimir valores):

```powershell
(Select-String -Path .env.local -Pattern '^ADMIN_' | ForEach-Object { ($_.Line -split '=')[0] })
# → ADMIN_EMAIL
# → ADMIN_PASSWORD
```

- [ ] 1. **`playwright.config.ts`**: justo DESPUÉS del import inicial (arriba del todo, antes del resto de declaraciones), carga las claves del entorno a `process.env` — sólo claves; los valores NUNCA se imprimen:

```ts
import { defineConfig, devices } from "@playwright/test";

// Sólo claves a process.env; los valores NUNCA se imprimen. El admin de E2E
// (ADMIN_EMAIL/ADMIN_PASSWORD) sale de .env.local, igual que la app.
try {
  process.loadEnvFile(".env.local");
} catch {
  /* sin .env.local, los tests de admin fallan con su aserción */
}
```

- [ ] 2. **Suite nueva** con la MISMA política de axe que `tests/accesibilidad.spec.ts` (WTAG + bloqueo critical/serious/`null`, `moderate`/`minor` por consola, `disableRules` vacío):

**Archivo nuevo `tests/identidad.spec.ts`:**

```ts
import { test, expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * E2E de identidad (spec F3-B §9): registro→perfil→logout→login, next,
 * errores inline, admin→/dashboard, cliente/invitado→403, cookie de 30
 * días, navbar por estado, sesión inválida y axe en /login.
 *
 * Los 19 E2E existentes NO se tocan. Los clientes de prueba se registran
 * con email aleatorio por ejecución (idempotente); el admin sale de
 * .env.local vía process.loadEnvFile en playwright.config.ts.
 */

const ETIQUETAS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const CONTRASENA_E2E = "ClaveE2E-2026";

function emailAleatorio(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@ejemplo.cu`;
}

/** La navbar tiene DOS <nav aria-label="Cuenta"> en el DOM (escritorio y
    menú móvil cerrado); se apunta siempre a la visible. */
function cuentaVisible(page: Page) {
  return page
    .getByRole("navigation", { name: "Cuenta" })
    .filter({ visible: true });
}

async function registrar(page: Page, email: string): Promise<void> {
  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(CONTRASENA_E2E);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/");
}

async function iniciarSesion(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(CONTRASENA_E2E);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test("registro → perfil → cierre → nuevo inicio de sesión", async ({ page }) => {
  const email = emailAleatorio();
  await registrar(page, email); // auto-login: cae en /
  await expect(cuentaVisible(page).getByRole("link", { name: "Mi perfil" })).toBeVisible();

  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
  await page.getByLabel("Nombre").fill("Cliente E2E");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("status")).toHaveText("Cambios guardados.");
  // Persistencia tras recarga (HU-15).
  await page.reload();
  await expect(page.getByLabel("Nombre")).toHaveValue("Cliente E2E");

  // Logout (HU-12) desde la navbar.
  await cuentaVisible(page)
    .getByRole("button", { name: "Cerrar sesión" })
    .click();
  await expect(page).toHaveURL("/");
  await expect(
    cuentaVisible(page).getByRole("link", { name: "Iniciar sesión" }),
  ).toBeVisible();

  // Nuevo login con las MISMAS credenciales.
  await iniciarSesion(page, email);
  await expect(page).toHaveURL("/");
  await expect(cuentaVisible(page).getByRole("link", { name: "Mi perfil" })).toBeVisible();
});

test("login con ?next=/perfil cae en /perfil", async ({ page }) => {
  const email = emailAleatorio();
  await registrar(page, email);
  await page.goto("/login?next=/perfil");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(CONTRASENA_E2E);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/perfil");
});

test("login con contraseña incorrecta: mensaje genérico", async ({ page }) => {
  const email = emailAleatorio();
  await registrar(page, email);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("ClaveErronea-2026");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("alert")).toHaveText(
    "Email o contraseña incorrectos.",
  );
});

test("registro con email ya registrado avisa en el campo email", async ({ page }) => {
  const email = emailAleatorio();
  await registrar(page, email);
  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(CONTRASENA_E2E);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/registro/);
  await expect(page.getByRole("alert")).toHaveText(
    "Ese email ya tiene una cuenta. Inicia sesión.",
  );
});

test("admin: login → /dashboard con bienvenida e índice", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const contrasena = process.env.ADMIN_PASSWORD;
  test.skip(!email || !contrasena, "Sin ADMIN_EMAIL/ADMIN_PASSWORD en .env.local");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Contraseña").fill(contrasena!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByRole("heading", { level: 1, name: "Panel de administración" }),
  ).toBeVisible();
  await expect(page.getByText(`Sesión iniciada como ${email}.`)).toBeVisible();
  await expect(page.getByText("Próximamente")).toHaveCount(3);
  // Los tiles NO son enlaces (spec §7: sin botones muertos).
  await expect(page.getByRole("link", { name: "Productos" })).toHaveCount(0);
});

test("invitado en /dashboard recibe 403 real", async ({ page }) => {
  const respuesta = await page.goto("/dashboard");
  expect(respuesta, "GET /dashboard no respondió").not.toBeNull();
  expect(respuesta!.status()).toBe(403);
  await expect(
    page.getByRole("heading", { name: "403 — no autorizado" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
    "href",
    "/login?next=/dashboard",
  );
});

test("cliente en /dashboard recibe 403", async ({ page }) => {
  const email = emailAleatorio();
  await registrar(page, email); // sesión de cliente recién creada
  const respuesta = await page.goto("/dashboard");
  expect(respuesta!.status()).toBe(403);
  await expect(
    page.getByRole("heading", { name: "403 — no autorizado" }),
  ).toBeVisible();
});

test("cookie de sesión: httpOnly, SameSite=Lax y caducidad a 30 días", async ({
  page,
  context,
}) => {
  const email = emailAleatorio();
  await registrar(page, email);
  const cookies = await context.cookies();
  const sesion = cookies.find((c) => c.name === "peache-sesion");
  expect(sesion, "existe la cookie peache-sesion").toBeDefined();
  expect(sesion!.httpOnly).toBe(true);
  expect(sesion!.sameSite).toBe("Lax");
  // Playwright expone `expires` (epoch, en lugar de `maxAge`): se afirma la
  // caducidad ABSOLUTA ≈ ahora + 2 592 000 s con ±1 h de margen de ejecución.
  const esperada = Date.now() / 1000 + 2592000;
  expect(Math.abs(sesion!.expires - esperada)).toBeLessThan(3600);
  // httpOnly: el script NO puede leerla — no aparece en document.cookie.
  const visibleParaScript = await page.evaluate(() => document.cookie);
  expect(visibleParaScript).not.toContain("peache-sesion");
});

test("navbar según el estado de sesión (escritorio)", async ({ page }) => {
  // Invitado.
  await page.goto("/");
  await expect(
    cuentaVisible(page).getByRole("link", { name: "Iniciar sesión" }),
  ).toBeVisible();
  await expect(
    cuentaVisible(page).getByRole("link", { name: "Mi perfil" }),
  ).toHaveCount(0);

  // Con sesión (cliente): sin enlace «Dashboard».
  const email = emailAleatorio();
  await registrar(page, email);
  await expect(
    cuentaVisible(page).getByRole("link", { name: "Mi perfil" }),
  ).toBeVisible();
  await expect(
    cuentaVisible(page).getByRole("link", { name: "Dashboard" }),
  ).toHaveCount(0);

  // Admin: además «Dashboard».
  await cuentaVisible(page)
    .getByRole("button", { name: "Cerrar sesión" })
    .click();
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminContrasena = process.env.ADMIN_PASSWORD;
  test.skip(!adminEmail || !adminContrasena, "Sin ADMIN_EMAIL/ADMIN_PASSWORD en .env.local");
  await page.goto("/login");
  await page.getByLabel("Email").fill(adminEmail!);
  await page.getByLabel("Contraseña").fill(adminContrasena!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(
    cuentaVisible(page).getByRole("link", { name: "Dashboard" }),
  ).toBeVisible();
});

test("cookie inválida → aviso de sesión caducada en /login", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "peache-sesion",
      value: "token-falso-e2e",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/perfil");
  await expect(page).toHaveURL(
    "/login?next=/perfil&aviso=expirada",
  );
  await expect(page.getByRole("status")).toHaveText(
    "Tu sesión ha caducado. Inicia sesión de nuevo.",
  );
});

test("/login sin violaciones critical/serious (tema light)", async ({ page }) => {
  // Misma política que tests/accesibilidad.spec.ts (D8): WTAG de A/AA,
  // bloquean critical/serious/null, moderate/minor por consola, sin
  // desactivar reglas.
  await page.addInitScript(() => {
    window.localStorage.setItem("peache-theme", "light");
  });
  const respuesta = await page.goto("/login");
  expect(respuesta, "GET /login no respondió").not.toBeNull();
  expect(respuesta!.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  const resultado = await new AxeBuilder({ page })
    .withTags(ETIQUETAS_WCAG)
    .analyze();

  const esBloqueante = (impacto: string | null | undefined): boolean =>
    impacto !== "moderate" && impacto !== "minor";
  const bloqueantes = resultado.violations.filter((v) => esBloqueante(v.impact));
  const ignoradas = resultado.violations.filter((v) => !esBloqueante(v.impact));

  if (ignoradas.length > 0) {
    console.warn(
      `[axe] /login (light) — ${ignoradas.length} violación(es) moderate/minor NO bloqueante(s):\n` +
        ignoradas
          .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodo(s))`)
          .join("\n"),
    );
  }

  const resumen =
    bloqueantes.length === 0
      ? ""
      : `\nViolaciones bloqueantes en /login:\n` +
        bloqueantes
          .map((v) => `  - [${v.impact}] ${v.id}: ${v.help}\n` + v.nodes.map((n) => `      ${n.html}`).join("\n"))
          .join("\n");

  expect(bloqueantes, resumen).toEqual([]);
});
```

- [ ] 3. Ejecuta la suite COMPLETA (los 19 existentes + los 11 nuevos; Playwright hará build+start fresco):

```powershell
npx playwright test
# → 19 existentes + 11 nuevos = 30 passed (Ninguno skipped si .env.local tiene ADMIN_*)
$LASTEXITCODE   # → 0
```

> Si un test nuevo falla, el fallo es de la APP: se corrige en `lib/auth/**`, `app/**` o `components/**`. **Ningún test existente se toca ni se desactiva** (spec §9: regla dura).

**→ Commit B10:** `playwright.config.ts`, `tests/identidad.spec.ts`.
Mensaje: `F3-B: suites E2E de identidad`

### T12 · Documentación (decisiones, HUs, arquitectura)

**Files:** `docs/decisiones.md` (modificar) · `docs/historias-usuario.md` (modificar) · `docs/arquitectura.md` (modificar) · `docs/design/componentes.md` (verificar; previsiblemente SIN cambios)

**Objetivo:** dejar rastro coherente de lo construido. Ningún documento de `docs/design/` se edita sin verificar antes.

- [ ] 1. **`docs/decisiones.md`**: añade esta sección (tras la sección «F3-A — Catálogo en PostgreSQL (27/10/2026)» o al final del fichero):

```md
## F3-B · Identidad (2026-10-29)

| ID | Decisión |
|---|---|
| **D-F3B-SESIONES** | Sesiones manuales con **`scrypt` nativo** (`node:crypto`, N=16384, r=8, p=1, keylen=64, sal de 16 B; comparación `timingSafeEqual`) y **cero dependencias nuevas** (Auth.js descartado, spec §2-§3). Cookie **`peache-sesion`** de **30 días** (`httpOnly`, `sameSite=lax`, `path=/`, `secure` según protocolo de la URL); en BD **sólo el SHA-256** del token (una fuga de BD no otorga sesiones). Renovación fija, sin sliding; limpieza oportunista de caducadas al crear sesiones nuevas. |
| **D-F3B-PROXY** | La protección de `/dashboard` vive en **`proxy.ts` de la raíz** (Next 16: `middleware` está deprecado y renombrado; runtime Node por defecto; verificado en `node_modules/next/dist/docs/…/proxy.md`). No existe `middleware.ts`. Responde **403 real** (status + HTML autocontenido con tokens y `prefers-color-scheme`) y el layout del dashboard re-verifica con `requerirAdmin()` (defensa en profundidad). |
| **D-F3B-ADMIN** | La cuenta admin inicial se crea en la **semilla** (`db/seed.ts`) como *upsert* desde `ADMIN_EMAIL`/`ADMIN_PASSWORD` de `.env.local`: `ON CONFLICT (email) DO UPDATE SET password_hash, rol` (sólo esas dos columnas — spec §8 literal). Re-ejecutar la semilla ×2 ⇒ exactamente 1 admin; **nunca** borra `usuarios` ni `sesiones`. Si faltan las variables: aviso en consola y se omite (no rompe entornos sin admin). |
| **D-F3B-DINAMICO** | `app/layout.tsx` lee la sesión (`cookies()`) para la navbar → **TODAS las rutas pasan a SSR dinámico (ƒ)** en el build. **Aceptado**: la navbar necesita estado y el rendimiento local es suficiente; el gate sigue siendo `npm run build` → exit 0. Hay 2 pools `pg` (catálogo y auth, máx. 5 cada uno). |
| **D-F3B-TIMING** | El login tiene **coste de timing uniforme**: si el email no existe se ejecuta igualmente un `hashContrasena` descartado antes de responder el mensaje genérico «Email o contraseña incorrectos.» (spec §11: no revelar qué emails tienen cuenta). Limitación conocida y aceptada en F3-B: **sin rate limiting** en `/login` (revisar en F3-C/D). |
```

- [ ] 2. **`docs/historias-usuario.md`**:

  - Tabla de HUs (líneas 28-35): cambia el estado de **🆕 → ✅ (2026-10-29)** en HU-10, HU-11, HU-12, HU-14, HU-15, HU-16 y HU-17. **HU-13 se queda 🆕** (requiere email → F3-E). Ejemplo de fila resultante:

    ```md
    | HU-10 | Como visitante, quiero registrarme (email y contraseña) para comprar con sesión iniciada. | ✅ (2026-10-29) |
    ```

  - Roadmap (línea 119): `2. **F3-B · Identidad**: registro, login, sesión, roles, rutas protegidas (HU-10…17).` → añade al final `**Hecho 2026-10-29**.`

- [ ] 3. **`docs/arquitectura.md`** (árboles; mismo criterio que el drive-by documentado en D-F3A-DOCS):

  - En el árbol raíz, tras la línea de `drizzle.config.ts`, añade:

    ```
    ├── proxy.ts                    # NUEVO F3-B: guard de /dashboard (Next 16; NO middleware.ts)
    ```

  - En `app/`, tras el bloque de `producto/`, añade:

    ```
    │   ├── login/
    │   │   └── page.tsx            # /login -> server action iniciarSesion (?next= validado)
    │   ├── registro/
    │   │   └── page.tsx            # /registro -> registrarUsuario (auto-login)
    │   ├── perfil/
    │   │   └── page.tsx            # /perfil -> sesión obligatoria (HU-15)
    │   └── dashboard/
    │       ├── layout.tsx          # requerirAdmin() — defensa en profundidad (spec F3-B §6)
    │       └── page.tsx            # bienvenida + índice «Próximamente» (sin enlaces)
    ```

  - Bajo `lib/`, tras el bloque de `catalogo/`, añade el bloque de `auth/` (SON 9 FICHEROS — el «7» del brief era previo a `base.ts` y `tipos.ts`/`acciones.ts`/`acceso.ts`/`pagina-403.ts` ya estaban):

    ```
    │   └── auth/                     # F3-B: identidad (pool PROPIO, spec F3-B §5)
    │       ├── base.ts               # pool perezoso de auth (max 5) + obtenerBase()
    │       ├── tipos.ts              # Rol, Usuario, CredencialUsuario, EstadoFormulario
    │       ├── contrasena.ts         # scrypt hash/verify (node:crypto, 0 deps)
    │       ├── validadores.ts        # email, ?next= (anti open-redirect)
    │       ├── repositorio-usuarios.ts # alta/búsqueda/perfil (Drizzle)
    │       ├── sesiones.ts           # token SHA-256 + cookie peache-sesion (30 d)
    │       ├── acceso.ts             # capa next/headers: obtenerSesionActual, requerirAdmin
    │       ├── acciones.ts           # "use server": login/registro/logout/perfil
    │       └── pagina-403.ts         # HTML autocontenido del 403 (proxy)
    ```

  - En la tabla de rutas, añade las filas de `/login`, `/registro`, `/perfil` (Server + server actions) y `/dashboard` (Server, protegida por proxy + layout).
  - Añade esta nota (junto a la de rutas futuras): **`app/layout.tsx` lee la sesión (F3-B) → todas las rutas se renderizan en request (ƒ); `lib/auth` mantiene su propio pool `pg`, independiente del de `lib/catalogo`; la navbar (`Cabecera`/`CuentaAcciones`) refleja el estado de cuenta (invitado/cliente/admin).**

- [ ] 4. **`docs/design/componentes.md`**: verifica si documenta la unión `tipo` de `CampoTexto` antes de tocarlo:

```powershell
Select-String -Path docs\design\componentes.md -Pattern 'CampoTexto|"search"|tipo\?'
# → sólo 1 coincidencia irrelevante (línea 611, "surface-alt"): NO documenta la unión `tipo`
```

  Al no documentarla, **no se modifica** (regla: si la enumerara, se añadiría `"password"` — aquí no aplica). Queda constancia en este paso.

- [ ] 5. `npm run lint` → 0 (los docs no afectan, pero el árbol debe seguir consistente).

**→ Commit B11:** `docs/decisiones.md`, `docs/historias-usuario.md`, `docs/arquitectura.md`.
Mensaje: `F3-B: documentacion de identidad y decisiones`

### T13 · Puerta final (obligatoria antes de declarar terminado)

**Files:** ninguno (sólo verificación y evidencia).

**Objetivo:** los 5 gates de la spec §10 en exit 0 + evidencias específicas (§10: semilla ×2 ⇒ 1 admin exacto; login E2E contra la BD real) + árbol limpio. **Sin salidas literales NO hay «terminado».**

**Prerrequisitos:** PostgreSQL arrancado · BD `peache` migrada · `.env.local` con `DATABASE_URL`, `FUENTE_CATALOGO=postgres` y `ADMIN_*` (sin ellos el test admin de E2E se salta y el gate exige 30 passed) · puerto 3000 libre.

- [ ] 1. Gates (capturar `$LASTEXITCODE` tras cada uno):

```powershell
npm run typecheck
$LASTEXITCODE   # → 0

npm run lint
$LASTEXITCODE   # → 0

npx vitest run
# → Test  60 passed   (48 intactas + 12 nuevos; el literal manda)
$LASTEXITCODE   # → 0

npx playwright test
# → 30 passed   (19 intactos + 11 nuevos; Ninguno skipped)
$LASTEXITCODE   # → 0

npm run build
$LASTEXITCODE   # → 0
```

- [ ] 2. Semilla ×2 + conteo admin (evidencia específica de la spec §10):

```powershell
npm run db:seed
# → ✓ Cuenta admin: admin@peache.local
# → ✓ Semilla aplicada: 14 productos, 3 categorías y 1 administrador(es).
npm run db:seed
# → ✓ Cuenta admin: admin@peache.local
# → ✓ Semilla aplicada: 14 productos, 3 categorías y 1 administrador(es).
$LASTEXITCODE   # → 0
$psql = (Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" | Sort-Object FullName -Descending | Select-Object -First 1).FullName
& $psql -U postgres -d peache -c "SELECT rol, count(*) FROM usuarios GROUP BY rol;"
# → rol    | count
#  --------+-------
#  admin   |      1
& $psql -U postgres -d peache -c "SELECT count(*) FROM sesiones;"
# → count > 0 si los E2E dejaron sesiones vivas (no se borran: spec §8)
```

- [ ] 3. Árbol limpio y secretos fuera de git:

```powershell
git status --porcelain
# → (vacío: todo commiteado en B1…B11)
git ls-files .env.local
# → (vacío: el fichero de secretos NUNCA se commitea)
git log --oneline -11
# → 11 commits F3-B: … (B1…B11)
```

- [ ] 4. **Regla dura recordada** (spec §9): ninguno de los 48 unit + 19 E2E existentes se tocó para que algo pasara; los tests nuevos viven en `tests/unit/auth.test.ts` y `tests/identidad.spec.ts`. Si algún gate falla, el fallo se corrige en código de la APP, nunca en los tests.

- [ ] 5. **Resumen final en español** (para la devolución al cliente): número exacto de tareas, salidas literales de los 5 gates, de la semilla ×2 y del psql; lista de lo que quedó entregado (HU-10, 11, 12, 14, 15, 16, 17) y de lo que queda (HU-13 → F3-E, HU-18 → F3-D, rate limiting → revisión F3-C/D). NUNCA incluir contraseñas, tokens ni la cadena de `DATABASE_URL`.

**Sin commit** (B11 fue el último; T13 sólo verifica).

---

## Autorrevisión

- **Placeholders ausentes:** todos los bloques de código de T1-T12 son completos y ejecutables tal cual (cero «aquí va X»); los únicos marcadores son los `- [ ]` de seguimiento y los `0001_<nombre>`/`0001_*.sql`, que los genera `drizzle-kit` (nombre aleatorio imposible de fijar).
- **Nombres cruzados consistentes:** `hashContrasena`/`verificarContrasena`/`longitudClaveValida` (T2→T4 semilla→T5 login→T6 registro), `normalizarEmail`/`emailValido`/`validarNext` (T3→T5→T6→páginas login/registro), `crearUsuario`/`buscarCredencialPorEmail`/`actualizarPerfilUsuario` (T4→T5/T6/T7), `crearSesion`/`buscarSesionValida`/`borrarSesion`/`NOMBRE_COOKIE`/`OPCIONES_COOKIE_SESION` (T4→T5/T7→T8 proxy→T10 layout), `obtenerSesionActual`/`requerirAdmin` (T5→T7→T9→T10), `EstadoFormulario`/`Rol`/`CuentaCabecera` (T4→T5-7→T10), `pagina403` (T8→proxy), microcopy literal del spec («Email o contraseña incorrectos.», «Ese email ya tiene una cuenta. Inicia sesión.», «La contraseña debe tener entre 8 y 128 caracteres.», «Cambios guardados.», «Tu sesión ha caducado. Inicia sesión de nuevo.», «403 — no autorizado», «Sólo el administrador puede acceder a esta zona.», «Panel de administración», «Próximamente») idéntico entre acciones, páginas y E2E.
- **Cobertura del spec:** §3 sin dependencias ✓ (sólo `node:crypto`) · §4 esquema+migración 0001 ✓ (T1) · §5 auth ✓ (T2-T7) · §6 proxy/403 + defensa en profundidad ✓ (T8-T9) · §7 pantallas y navbar ✓ (T5-T7, T9-T10) · §8 semilla idempotente sin borrar usuarios/sesiones ✓ (T4) · §9 pruebas (unit nuevos + E2E nuevos, existentes intactos) ✓ (T2-T4, T11) · §10 gates ✓ (T13) · §11 seguridad (timing-safe, token sólo hasheado, httpOnly+lax, `?next=` validado, SQL parametrizado, mensajes genéricos, sin secretos en logs) ✓ · §12 árbol ✓ (T12).
- **Decisiones tomadas al escribir el plan** (todas coherentes con el spec): (a) `lib/auth/` son **9** ficheros (el «7» del brief no contaba `base.ts` y los módulos ya listados); (b) el email de perfil se renderiza dentro de `FormularioPerfil` (recibiéndolo por props) para conservar la anatomía `.formulario`; (c) `CampoTexto` gana `"password"` en T5 con justificación registrada, y `docs/design/componentes.md` NO se toca (verificado en T12.4: no documenta la unión `tipo`); (d) los tests unitarios nuevos suman **12** (7+3+2) → 60 en total; (e) el E2E de navbar usa `.filter({ visible: true })` porque hay dos `<nav aria-label="Cuenta">` en el DOM (escritorio + menú móvil cerrado).
- **Riesgos vigilados:** `next build` con el layout leyendo cookies marca todas las rutas ƒ (esperado, D-F3B-DINAMICO); el proxy debe short-circuit sin cookie para no tocar la BD; Playwright expone `expires` y no `maxAge` (el test de cookie afirma la caducidad absoluta ±1 h); en Windows, matar el servidor de T8 por dueño del puerto (no por wrapper `npm`).
