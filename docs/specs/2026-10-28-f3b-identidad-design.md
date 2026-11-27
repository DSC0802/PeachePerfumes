# Diseño F3-B — Identidad y acceso (sesiones manuales)

**Fecha:** 2026-10-28 · **Estado:** aprobado por el cliente
**Decisión relacionada:** `docs/decisiones.md` D2 (login completo, dashboard admin) · HU-10…17
**Alcance:** segundo bloque de la Fase 3. Siguientes bloques: F3-C catálogo+moneda, F3-D pedidos, F3-E reportes+email (`docs/historias-usuario.md`).

---

## 1 · Objetivo

Abrir la **puerta de entrada del dashboard**: registro, login, sesión persistente, roles y `/dashboard` protegida con **403 real** para el que no sea admin. Criterio de éxito: los 5 gates en exit 0 y los flujos de identidad cubiertos por E2E.

**Entra en F3-B:** HU-10 registro · HU-11 login · HU-12 logout · HU-14 sesión 30 días · HU-15 perfil · HU-16 admin · HU-17 protección `/dashboard` (403).

**No entra:** HU-13 recuperar contraseña (requiere email → F3-E) · HU-18 Mis pedidos (requiere pedidos → F3-D) · CRUD de usuarios, OAuth, 2FA, cambio de email, rate limiting.

## 2 · Decisiones recogidas del cliente (2026-10-28)

| # | Decisión |
|---|---|
| 1 | **Sesiones manuales con `scrypt` nativo** (`node:crypto`) — cero dependencias nuevas. Auth.js descartado. |
| 2 | Alcance = **HU-10, 11, 12, 14, 15, 16, 17**. |
| 3 | La cuenta admin inicial se crea en **`db/seed.ts` desde `ADMIN_EMAIL`/`ADMIN_PASSWORD` de `.env.local`**. |
| 4 | Sesión de **30 días siempre** (cookie persistente; sin casilla «mantenerme conectado»). |
| 5 | `/dashboard` en F3-B = **bienvenida + índice de secciones** (tiles informativos «Próximamente», sin botones muertos). |
| 6 | Todo no-admin recibe **403 real** (status HTTP 403 + página propia con enlace «Iniciar sesión»). |

### Mapa del dashboard por bloque (quedó registrado a petición del cliente)

| Bloque | Dashboard | HUs |
|---|---|---|
| **F3-B** (este) | Puerta: login admin, roles, `/dashboard` protegida + índice | HU-10…17 |
| **F3-C** | CRUD de productos, estados, stock, tasa CUP/USD | HU-20…27, HU-50…53 |
| **F3-D** | Pedidos (lista, detalle, estados), notificación de compra, Mis pedidos | HU-30…38, HU-40 |
| **F3-E** | Reportes/economía, email (notificaciones y HU-13) | HU-13, HU-41…43 |

## 3 · Dependencias a instalar

**Ninguna.** Todo con `node:crypto` (scrypt), `crypto.randomUUID()` y lo ya instalado (`pg`, `drizzle-orm`). Cualquier instalación futura requeriría aprobación explícita (`AGENTS.md`).

## 4 · Esquema (migración `0001`, generada con `drizzle-kit generate`)

### `usuarios`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | generado por la BD |
| `email` | text UNIQUE NOT NULL | normalizado: `trim` + minúsculas |
| `password_hash` | text NOT NULL | formato `scrypt$N$r$p$salt$hash` (§5) |
| `nombre` | text | perfil (HU-15), editable |
| `telefono` | text | WhatsApp (HU-15), editable |
| `rol` | enum `rol_usuario` NOT NULL DEFAULT `'cliente'` | valores: **admin · cliente** |
| `creado_en`, `actualizado_en` | timestamptz | auditoría mínima |

### `sesiones`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `usuario_id` | uuid FK → `usuarios` ON DELETE CASCADE | |
| `token_hash` | text UNIQUE NOT NULL | SHA-256 del token (hex). **Nunca se guarda el token crudo** |
| `creada_en`, `expira_en` | timestamptz NOT NULL | `expira_en = creada_en + 30 días` |

Índices: `sesiones(usuario_id)`, `sesiones(expira_en)` (limpieza). Logout = borrar la fila. Renovación: **fija, sin sliding** (la sesión dura 30 días desde su creación). Limpieza oportunista de caducadas al crear sesiones nuevas.

## 5 · Autenticación (`lib/auth/`)

- **Hash de contraseña:** `scrypt` de `node:crypto` con N=16384, r=8, p=1, keylen=64, salt aleatorio de 16 B por usuario; verificación con `timingSafeEqual`. Longitud **8–128 caracteres** (128 tope anti-DoS).
- **Token de sesión:** 32 bytes aleatorios (base64url) entregados en cookie `peache-sesion` — `httpOnly`, `sameSite=lax`, `path=/`, `Max-Age=2592000` (30 días), `secure` según protocolo de la URL (false en http local). En BD sólo su SHA-256.
- **Login:** mensaje genérico **«Email o contraseña incorrectos.»** — no revela si el email existe. Server actions con `useActionState` (error inline + botón pending).
- **Destino tras login:** se respeta `?next=` si es ruta interna (empieza por `/`, no por `//` o `/\`); sin `next`, admin → `/dashboard`, cliente → `/`.
- **Registro:** email + contraseña; el rol se fija **siempre `cliente`** (no hay auto-promoción). Email duplicado → error inline.
- **Logout (HU-12):** server action → borra la fila de sesión + borra la cookie → redirige a `/`.
- Helper compartido: `requerirAdmin()` / `obtenerSesionActual()` — cookie → SHA-256 → sesión vigente → usuario; consumidos por `proxy.ts`, el layout del dashboard y la navbar.

## 6 · Protección de `/dashboard` (HU-17) — `proxy.ts` de Next 16

Verificado en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`: **`middleware` está deprecado y renombrado a `proxy.ts`** (v16), **corre por defecto en runtime Node.js** (puede consultar la BD) y **puede producir respuestas con status arbitrario**.

- `proxy.ts` en la raíz, `config.matcher = ['/dashboard/:path*']` (no toca assets ni el resto de la tienda).
- Validación: cookie → hash → sesión vigente → `rol === 'admin'`. Si algo falla → **respuesta directa `Response` con status 403** y página HTML autocontenido (§7).
- **Defensa en profundidad:** `app/dashboard/layout.tsx` re-verifica con `requerirAdmin()` y aporta los datos de bienvenida; si el proxy pasó pero la sesión caducó entre ambos, redirect a `/login`.
- La página 403 del proxy es HTML mínimo autocontenido (no pasa por React): estilos inline con los tokens de color del proyecto + `prefers-color-scheme` (claro/oscuro), tipografía de sistema (D10: sin webfonts). Contenido: `h1` «403 — no autorizado», texto «Sólo el administrador puede acceder a esta zona.», botón «Iniciar sesión» (`/login?next=/dashboard`) y enlace «Volver a la tienda» (`/`).
- El parámetro `?next=` se valida siempre (open-redirect) en login y en el 403.

## 7 · Pantallas y estados (español, sistema de diseño existente)

| Ruta | Contenido | Estados |
|---|---|---|
| `/login` | email + contraseña; enlace «Crear cuenta» | error inline genérico, pending, sesión expirada → aviso |
| `/registro` | email + contraseña (≥8); enlace «Iniciar sesión» | email duplicado inline, pending |
| `/perfil` (con sesión) | email solo lectura; editar nombre y teléfono/WhatsApp. Sin sesión → redirect `/login?next=/perfil` | guardado con confirmación, error inline |
| `/dashboard` (admin) | tarjeta de bienvenida (email del admin) + índice: Productos (F3-C), Pedidos (F3-D), Reportes (F3-E) como tiles **informativos** «Próximamente» — no son enlaces | vacío real: sin contadores inventados |
| `403` (proxy) | HTML autocontenido (§6) | — |

**Navbar según estado:** invitado → «Iniciar sesión» · «Crear cuenta»; con sesión → «Mi perfil» · «Cerrar sesión»; admin → además «Dashboard».

Cada ruta con `error.tsx` propio o heredado de la raíz: si la BD no responde, se muestra el error (**sin fallback**, mismo criterio que F3-A §7).

## 8 · Semilla (ampliación idempotente)

- El borrado e inserción del catálogo **no cambia**.
- **Nuevo:** *upsert* del admin usando `ADMIN_EMAIL`/`ADMIN_PASSWORD` de `.env.local`: `INSERT … ON CONFLICT (email) DO UPDATE SET password_hash = <nuevo>, rol = 'admin'` (así una cuenta preexistente con ese email queda promovida y con la contraseña vigente). Si faltan las variables: **aviso en consola y se omite el admin** (no rompe entornos sin admin).
- **Nunca borra `usuarios` ni `sesiones`.** Re-ejecutar ×2 ⇒ sigue habiendo exactamente 1 admin y las sesiones vivas intactas.

## 9 · Estrategia de pruebas

| Suite | Qué cubre | Acción |
|---|---|---|
| Unit (vitest) | crypto (hash↔verify, formato, timing-safe), validadores de email/`?next=`, SHA-256 de token | **nuevas**; las 48 existentes intactas |
| E2E (playwright) | registro→login→perfil→logout; admin→`/dashboard` (bienvenida+índice); cliente→403; invitado→403; cookie con `Max-Age=2592000`; navbar por estado | **nuevos**; los 19 existentes intactos |
| Mirror (vitest, BD) | catálogo | sin cambios — las tablas de auth no interfieren |

E2E: el admin sale de `.env.local` (Playwright lo carga en `playwright.config.ts` con `process.loadEnvFile`, **sin imprimir valores**); los clientes de prueba se registran con email aleatorio por ejecución (idempotente).

**Regla dura:** ningún test se toca ni se desactiva para «hacer pasar» nada (spec F3-A §8); los fallos son bugs de la app y se corrigen en código.

## 10 · Puerta de verificación (obligatoria antes de declarar terminado)

```
npm run typecheck   → exit 0
npm run lint        → exit 0
npx vitest run      → exit 0 (48 existentes + los nuevos)
npx playwright test → exit 0 (19 existentes + los nuevos)
npm run build       → exit 0
```

Más evidencia específica: semilla ×2 ⇒ **1 admin exacto**; login E2E contra la BD real. Salida literal de todo en la devolución. Sin ella, no hay «terminado».

## 11 · Seguridad

- scrypt cost alto + `timingSafeEqual`; token sólo como hash en BD (una fuga de BD no otorga sesiones).
- Cookie httpOnly + sameSite=lax; `secure` en https.
- `?next=` restringido a rutas internas (anti open-redirect).
- SQL siempre parametrizado vía Drizzle; mensajes de login genéricos; ninguna contraseña ni token en logs/errores.
- **Limitación conocida y aceptada en F3-B:** sin rate limiting en `/login` (se anota para revisión de seguridad en F3-C/D cuando haya superficie pública real).

## 12 · Estructura resultante

```
proxy.ts                    # NUEVO — guard de /dashboard (Next 16; NO middleware.ts)
lib/auth/
├── contrasena.ts           # scrypt hash/verify
├── sesiones.ts             # crear/validar/borrar sesión + cookie
├── repositorio-usuarios.ts # alta, búsqueda por email/id (Drizzle)
├── validadores.ts          # email, longitud, ?next=
└── pagina-403.ts           # HTML autocontenido del 403
app/
├── login/page.tsx          # NUEVO
├── registro/page.tsx       # NUEVO
├── perfil/page.tsx         # NUEVO (protegido por sesión)
├── dashboard/layout.tsx    # NUEVO — re-verificación + shell
├── dashboard/page.tsx      # NUEVO — bienvenida + índice
db/schema.ts                # + usuarios, sesiones (migración 0001)
db/seed.ts                  # + upsert admin
.env.local                  # + ADMIN_EMAIL, ADMIN_PASSWORD (gitignored)
```

## 13 · Fuera de alcance / pendientes abiertos

- HU-13 recuperar contraseña y emails → F3-E. HU-18 Mis pedidos → F3-D.
- CRUD de usuarios, promoción de admins desde UI, cambio de email, OAuth, 2FA, rate limiting → pendientes por valorar en F3-C+.
- Las secciones enlazadas desde el índice del dashboard llegan en F3-C/D/E (tiles «Próximamente» hasta entonces).
