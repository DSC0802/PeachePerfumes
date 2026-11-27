# Decisiones del project-manager — Peache Perfumes

**Fecha:** 2025-10-25 · **Alcance:** Fases 0-2

Registro de las contradicciones detectadas **entre documentos** durante la Fase 1 y
cómo se han resuelto. Todas ellas fueron reportadas por los agentes `design`,
`architect`, `frontend` y `backend`; ninguna se corrigió en silencio.

**Jerarquía de fuentes aplicada:**

1. `docs/design/*` manda sobre **presentación** (cómo se ve, cómo se comporta).
2. `docs/arquitectura.md` manda sobre **técnicas** (estructura, tipos, fronteras).
3. `docs/api-contracto.md` manda sobre el **contrato de datos**.
4. Cuando un documento pertenece al área de otro, cede.

---

## Tema (claro/oscuro)

| ID | Decisión |
|---|---|
| **D-TEMA-1** | Clave de `localStorage` **`peache-theme`**, valores **`dark` \| `light` \| `system`**. `componentes.md` §13 ya usaba `peache-theme` en inglés; `arquitectura.md` §7 usaba `peache-tema` en español con valores `oscuro/claro`. Se unifica al inglés para que la clave, los valores y el atributo `data-theme="dark"\|"light"` hablen el mismo idioma. **Actualizados ambos documentos.** |
| **D-TEMA-2** | Ciclo **`light → dark → system`** con **3 `aria-label`**, cada uno describiendo **el destino de la pulsación** — no el estado actual. `componentes.md` §13 especificaba 2 textos y `arquitectura.md` §7.4 tres estados: con sólo 2 textos el control miente en el tercer paso (WCAG 2.5.3). **Mapeo canónico ratificado:** |

  | Estado actual | Próxima pulsación | `aria-label` / `title` |
  |---|---|---|
  | `light` | → `dark` | «Cambiar a modo oscuro» |
  | `dark` | → `system` | «Seguir el sistema» |
  | `system` | → `light` | «Cambiar a modo claro» |

  *Nota:* escribir la lista como una secuencia «oscuro → claro → sistema» es ambigua y parece contradecir la decisión; **manda la tabla.** Ver también D-TEMA-3. |
| **D-TEMA-3** | `estados-y-responsividad.md` §4.5, fila «Tema», sigue describiendo el canón de 2 estados («invertido en oscuro»). **Obsoleto**: debe leer «Cambiar a modo oscuro» en claro, «Seguir el sistema» en oscuro y «Cambiar a modo claro» en sistema. Pendiente de corrección en `design`. |

## Componentes

| ID | Decisión |
|---|---|
| **D-SKIP** | Skip link → **`#contenido`** (arquitectura §8 y `layout.tsx`). `componentes.md` §5 decía `#main`. |
| **D-CTA** | `Boton` acepta `href` y renderiza un `<a>` real con estética de botón. Resuelve §1 («si navega → Enlace») frente a §15 («Ver el catálogo» → `Boton`). Ratificado. |
| **D-TOUCH** | La variante `sm` (36px) queda **excluida** del requisito ≥44px porque no se usa como objetivo táctil primario en Fase 2. Toda acción real mantiene `--touch-target`. |
| **D-HERO** | Ratio de imagen de `componentes.md` §14.3 (16/9 móvil → 3/2 ≥768px), no el 3:2 único de `estados-y-responsividad.md` §5.2. ≥1024px: patrón hero dividido (§14.4). |
| **D-FILTROS** | Chips de filtros = **`<button aria-pressed>`** (`design`). `arquitectura.md` §8 decía «enlaces»; cede porque es especificación de componente. |
| **D-PELIGRO** | La variante `peligro` usa `opacity`, **sin** tokens `--color-error-hover/-active`. No se añaden tokens: rompería la regla de que todo token tiene par en ambos modos sin necesidad real hoy. |
| **D-SELECT** | El selector «Ordenar» es un **`<select>` nativo** con aspecto del sistema, tal como lo pide `estados-y-responsividad.md` §2.1. No estaba en `componentes.md`: se implementa en Fase 2 con `CampoTexto` como base de estilo. |
| **D-MONOGRAMA** | El placeholder de imagen muestra **`PP`** en `--font-brand-serif`, `aria-hidden`, hasta que llegue el logotipo real del cliente. `identidad.md` §1 lo excluye de diseñar. |
| **D-MICROCOPY** | Se ratifican los textos mínimos inventados por `frontend`: `titulo="Menú"` (§12 prohíbe `aria-label` sin título en diálogos) y «Familia» para el grupo de chips. |
| **D-CLIENT** | **6** archivos con `"use client"` en Fase 2, no los ≤3 que fija `arquitectura.md` §9: `Cabecera`, `ConmutadorTema`, `HojaModal`, `MarcoImagen`, `Buscador`, `Filtros`. Cada uno tiene estado real exigido por los specs (menú, `<dialog>`, `onError` de imagen, buscador controlado, hoja). El resto sigue siendo Server Components. **Se acepta la desviación.** |

## Accesibilidad — correcciones del 26/10/2026

Destapadas por la suite de axe-core (D8). **Ninguna se arregló debilitando los tests.**

| ID | Decisión |
|---|---|
| **D-A11Y-LOGO** | `label-content-name-mismatch` (serious, WCAG 2.5.3) en el enlace del logo. Causa raíz real (verificada contra el código de axe): **no era capitalización** — los dos `<span>` del wordmark eran adyacentes en el flex, así que el texto visible se concatenaba como «PeachePERFUMES» (un único token), imposible de encontrar en el nombre accesible. Fix: espacio explícito `{" "}` entre los `<span>` (sin impacto visual en el flex columna) + `aria-label="Peache PERFUMES — inicio"`, que ahora contiene el texto visible literal y conserva el contexto de destino. |
| **D-A11Y-CONTRASTE** | axe audita el wordmark como **texto**, no lo exime como logotipo: `--color-brand-provisional` daba 3.21:1 sobre cabecera y 2.75:1 sobre pie (< 4.5:1, WCAG 1.4.3). El wordmark usa ahora **`--color-accent`** (≥ 4.5:1 verificado en ambos temas). **Obsoleto en `identidad.md`:** la exención «logotipo exento de 1.4.3» y la regla «wordmark sólo sobre `surface`/`bg`» (§6, tabla de ratios). `design` lo corrige. `MarcoImagen` conserva `--color-brand-provisional` (placeholder SVG, no auditado como texto). `arquitectura.md` § líneas sobre el rosa quedan algo desactualizadas (menor). |

Verificación tras los fixes: typecheck 0 · lint 0 · build 0 · vitest 24/24 · **playwright 19/19** (10 de accesibilidad incluidos).

## Datos y dinero

| ID | Decisión |
|---|---|
| **D-DATOS-1** | Se **añade `familia: FamiliaOlfativa`** a `Producto` y `familia?` a `ProductoFiltro`. `estados-y-responsividad.md` §2.1 exige chips de familia con estado `?familia=floral`, pero el tipo no la tenía (el contrato prohibía campos de más). Es requisito del alcance autorizado de Fase 2 («búsqueda y filtros de interfaz»), así que **el contrato se amplía**: union `citrico \| floral \| amaderado \| oriental \| frutal \| acuatico \| gourmand`, y parámetro `familia` en `GET /api/v1/productos`. |
| **D-DATOS-2** | `OrdenCatalogo` gana **`nombre-asc`** (lo pide el «Ordenar: Nombre A→Z» de §2.1) y conserva `novedades` (lo usa la landing). 5 valores. Actualizado `api-contracto.md` §2.3. |
| **D-DINERO-1** | El dinero se pinta **sólo** con `components/ui/Precio` → `Intl.NumberFormat("es-CU", { style: "currency" })` + «CUP» accesible aparte. `formatearPrecio()` de `arquitectura.md` §6.3 concatenaba `$` + número, lo que §10 de `componentes.md` prohíbe explícitamente. **Gana `design` en presentación.** No se crea `lib/dinero.ts`: sería código muerto. |
| **D-DESCRIPCION** | `descripcion` **sin** la frase «De demostración.» incrustada: el aviso de datos demo es responsabilidad de la UI (un bloque fijo), no del texto de cada producto. |

## Entorno

| ID | Decisión |
|---|---|
| **D-ESLINT** | **ESLint 9.39.5**, no 10.x. `eslint-config-next@16.4.3` declara peer `>=9`, pero sus plugins embebidos (`eslint-plugin-import`, `jsx-a11y`, `react`) exigen `^8 \|\| ^9`: con ESLint 10 el árbol queda `invalid`. El aviso de deprecación de la 9.x es el precio correcto. |
| **D-TSCONFIG** | `next dev` reescribe `tsconfig.json` (`jsx: preserve → react-jsx`, `include += .next/dev/types`). **Se conserva**: revertirlo rompe Next 16. |
| **D-AGENTS** | `next dev` añadió el bloque `nextjs-agent-rules` a `AGENTS.md`. **Se conserva** (el propio bloque indica que quitarlo sólo re-crea el cambio). |
| **D-IMAGENES** | No hay fotos de producto. `imagen.src` apunta a `/productos/<slug>.webp` (archivos inexistentes a propósito) y la interfaz usa el placeholder neutral de `componentes.md` §14. |

---

## Decisiones del cliente (26/10/2026)

| ID | Decisión | Valor acordado |
|---|---|---|
| **D1** | Base de datos | **Deroga la decisión anterior («empezar sin DB»): sí hay BD y es PostgreSQL.** *(27/10/2026)* **PostgreSQL local ahora → en la nube después**: se instala en la máquina del cliente (instalación pendiente de permiso explícito) mientras dure el D4 (todo en local); migrar a la nube después = cambiar `DATABASE_URL`, el motor y el código no cambian. Se descartó Supabase por ahora: es empresa de EE.UU. y su acceso desde Cuba no pudo verificarse. **✅ Instalación ejecutada el 27/10/2026** (winget + UAC aprobados por el cliente; BD «peache» creada el 28/10/2026, tras restablecer la contraseña del rol `postgres` con UAC aprobado). |
| **D2** | Autenticación | **Login completo.** El Dashboard es **sólo del administrador** y debe: recibir **notificación cuando un cliente compre**, crear productos, eliminarlos, actualizar sus estados, llevar la economía y generar reportes. Alcance a planificar en la Fase 3. |
| **D3** | Pagos/cobro | **Efectivo contra entrega** — el cliente paga en efectivo al recibir el pedido; sin pasarela automática ni prepago. WhatsApp/teléfono sólo para coordinar la entrega. *(05/11/2026: sustituye a «pago manual + WhatsApp» con transferencia/MLC.)* |
| **D4** | Hosting + dominio | **Ejecución en local** por ahora; dominio y despliegue cuando el cliente compre uno. |
| **D5** | Moneda y precios | **USD como moneda base** (precios almacenados en USD). El usuario puede conmutar a **CUP**; la relación `CUP por 1 USD` la fija el **administrador en el Dashboard**. `data/productos.ts` (hoy en CUP) se migrará a USD. **✅ Ejecutado en F3-A (27/10/2026):** `data/productos.ts` y la semilla Postgres usan la tabla USD aprobada (spec F3-A §4); `Moneda = "USD"`. |
| **D7** | Contenido legal | **Pospuesto** — términos, privacidad y cookies en una fase posterior. |
| **D8** | Herramientas de testing | **Sí** — Playwright + `axe-core` (E2E y accesibilidad) y Vitest: **ya configurado el 26/10/2026** (`playwright.config.ts`, `vitest.config.ts`, 4 suites). **+ F3-A (27/10/2026):** 5.ª suite — espejo Postgres en `tests/integracion/` (24 tests). |
| **D9** | `git init` | ✅ **Ejecutado** — repositorio inicializado en la raíz. |
| **D10** | Webfonts *(nota)* | **Resuelta 05/11/2026:** aprobadas Archivo y Courier Prime (OFL, autoalojadas en `app/fonts/` con `next/font/local`); ver D-DISENO-FUENTES. |

### Tensión técnica abierta (bloqueante para la Fase 3)

`D1` (BD en la nube) + `D2` (login completo y dashboard administrativo) + `D5` (moneda base USD) amplían el alcance **más allá de las Fases 0-2** y exigen, antes de implementar:

1. **Elección de proveedor** por parte del cliente (no auto-seleccionable).
2. **Aprobación explícita de dependencias** (SDK del proveedor) — `AGENTS.md` lo exige.
3. **Plan de Fase 3** aprobado por el cliente (dashboard, pedidos, notificaciones, reportes, cambio de moneda).

Ver también `docs/arquitectura.md` §12 (lista de pendientes).

---

## F3-A — Catálogo en PostgreSQL (27/10/2026)

| ID | Decisión |
|---|---|
| **D-F3A-DEPS** | Instalaciones **aprobadas por el cliente** el 27/10/2026: PostgreSQL local vía `winget` + UAC (Docker descartado: no estaba instalado y la sesión no era administradora) y **`tsx`** como dependencia de desarrollo para ejecutar `db/seed.ts`. |
| **D-F3A-FILTRO** | Filtros y orden viven en **`lib/catalogo/filtro.ts`**, compartido por los dos repositorios. En Postgres, SQL sólo selecciona filas visibles (`NOT oculto`) y busca por `slug`; el filtrado — incluido `nombre-asc` con `localeCompare("es")` — se hace en memoria **para garantizar paridad exacta demo⇄Postgres sin atarse a la colación del clúster**. Migrará a SQL cuando llegue la paginación (F3-C+). |
| **D-F3A-ESPEJO** | La suite espejo adapta UNA aserción de las 24: «primer elemento = primero del archivo de datos» → **estabilidad entre consultas** (una tabla no tiene orden de archivo garantizado). La suite demo queda intacta. Sin BD, la espejo se salta con **aviso visible por stderr** (spec §8: omitir, nunca fingir). |
| **D-F3A-COMENTARIOS** | En `tests/unit/catalogo.test.ts` sólo se actualizaron **dos comentarios** (`1350 CUP`→`25 USD`, `4500 CUP`→`89 USD`); ninguna aserción se tocó (spec §8). |
| **D-F3A-DOCS** | Drive-by justificado al actualizar los árboles de `arquitectura.md`: listaban `lib/dinero.ts`, que **nunca existió** (D-DINERO-1 ya lo vetó). Al añadir `db/` y `filtro.ts` a esos árboles se corrige también esa línea. |
| **D-F3A-ESQUEMA** | `db/schema.ts` se ajustó al API real de las versiones instaladas (autorización del paso T4.2): `sql` se importa de `drizzle-orm` (no de `pg-core`) y `slug` usa `uniqueIndex()` en el callback de tabla, porque `.unique()` de columna genera `CONSTRAINT ... UNIQUE` y T4.2 exige `CREATE UNIQUE INDEX`. El bloque de código de T4 en el plan es inexecutable tal cual; la fuente de verdad es `db/schema.ts`. |
| **D-F3A-SEC-DEPS** | `npm audit` (27/10/2026): 4 *moderate* de `esbuild ≤0.24.2` — transitivo de `drizzle-kit` (dev-only), advisory GHSA-67mh-4wv8-2f99 (servidor de desarrollo de esbuild, no utilizado aquí); `npm audit --omit=dev` → **0 vulnerabilidades**. **Aceptado**: no hay fix sin degradar `drizzle-kit` a 0.18.1; prohibido `npm audit fix --force`. `npm audit signatures` falló por red (informativo, compensado por `resolved` oficial + `integrity` sha512). |

## F3-B · Identidad (2026-10-29)

| ID | Decisión |
|---|---|
| **D-F3B-SESIONES** | Sesiones manuales con **`scrypt` nativo** (`node:crypto`, N=16384, r=8, p=1, keylen=64, sal de 16 B; comparación `timingSafeEqual`) y **cero dependencias nuevas** (Auth.js descartado, spec §2-§3). Cookie **`peache-sesion`** de **30 días** (`httpOnly`, `sameSite=lax`, `path=/`, `secure` según protocolo de la URL); en BD **sólo el SHA-256** del token (una fuga de BD no otorga sesiones). Renovación fija, sin sliding; limpieza oportunista de caducadas al crear sesiones nuevas. |
| **D-F3B-PROXY** | La protección de `/dashboard` vive en **`proxy.ts` de la raíz** (Next 16: `middleware` está deprecado y renombrado). No existe `middleware.ts`. Responde **403 real** (status + HTML autocontenido con tokens y `prefers-color-scheme`) y el layout del dashboard re-verifica con `requerirAdmin()` (defensa en profundidad). |
| **D-F3B-ADMIN** | La cuenta admin inicial se crea en la **semilla** (`db/seed.ts`) como *upsert* desde `ADMIN_EMAIL`/`ADMIN_PASSWORD` de `.env.local` (`ON CONFLICT (email) DO UPDATE SET password_hash, rol`). Semilla ×2 ⇒ exactamente 1 admin; **nunca** borra `usuarios` ni `sesiones`. Sin las variables: aviso y se omite. |
| **D-F3B-DINAMICO** | `app/layout.tsx` lee la sesión (`cookies()`) para la navbar → **todas las rutas pasan a SSR dinámico (ƒ)**. **Aceptado**: la navbar necesita estado. Hay 2 pools `pg` (catálogo y auth, máx. 5 cada uno). |
| **D-F3B-TIMING** | Login con **coste de timing uniforme**: si el email no existe se ejecuta igualmente un `hashContrasena` descartado antes del mensaje genérico «Email o contraseña incorrectos.» (spec §11). Limitación aceptada: **sin rate limiting** en `/login` (revisar en F3-C/D). |
| **D-F3B-DASHBOARD** | (05/11/2026) El `app/dashboard/page.tsx` del commit 4b12502 no compilaba, usaba Tailwind (no instalado) y mostraba cifras inventadas. Se reescribió conforme a la spec §7 (bienvenida + índice «Próximamente») para cerrar F3-B; el panel real llega en F3-C. |

## F3-C (parcial) · Panel de administración (2026-11-05)

Spec: `docs/specs/2026-11-05-f3c-panel-admin-design.md`.

| ID | Decisión |
|---|---|
| **D-F3C-ALCANCE** | Decidido por el cliente (05/11/2026): panel profesional con tablas y reportes + CRUD de productos con foto. Los componentes Tailwind de `components/dashboard/` se **adaptan** (CSS modules, tokens, datos reales); `MetricCard` era un duplicado de `metricaTarjeta` y se fusionó en `MetricaTarjeta`. |
| **D-F3C-IMAGENES** | Fotos en **carpeta local** `almacen/imagenes/` (gitignored; `DIR_IMAGENES` la cambia), servidas por `app/imagenes/[archivo]/route.ts`. No en `public/`: Next sólo sirve lo que existía al hacer build. Validación por *magic bytes*, 4 MB máx., nombre `uuid.ext`. Al pasar a la nube habrá que migrarlas a un storage. |
| **D-F3C-STOCK** | Migración `0002`: `productos.stock` + `CHECK (stock >= 0)`. El stock no entra en el contrato público `lib/catalogo/tipos.ts`; el panel usa `ProductoAdmin`. Stock bajo = ≤ 5 unidades. |
| **D-F3C-MIGRACION** | Al generar la 0002, drizzle-kit quería convertir las `UNIQUE` de `usuarios.email` y `sesiones.token_hash` (creadas como *constraint* por la 0001) en índices, y la versión sin arreglar perdía la unicidad de `token_hash`. `db/schema.ts` vuelve a declararlas con `unique()` de tabla (igual que la BD) y se quitó a mano del SQL 0002 un `DROP INDEX` fantasma heredado del snapshot 0001. La 0002 sólo añade el stock y su CHECK; `db:generate` posterior: «No schema changes». |
| **D-F3C-SEMILLA** | La semilla deja de borrar y re-insertar (habría eliminado los productos creados en el panel): ahora hace *upsert* por `slug` y `id` de categoría. El stock de fábrica sólo se rellena en filas intactas (`stock = 0` y `actualizado_en = creado_en`). |
| **D-F3C-SIN-VENTAS** | Sin pedidos (F3-D) no hay ventas: los bloques de ventas muestran «Disponible con pedidos (F3-D)». «Productos más vendidos» pasa a «Mayor valor en inventario» (precio × stock). Ninguna cifra inventada. |
| **D-F3C-ACCIONES** | Las server actions del panel verifican `requerirAdmin()` una a una: el proxy sólo cubre las rutas `/dashboard/:path*`, no los POST de acciones. |
| **D-F3C-SOFT404** | Un producto oculto muestra «No encontramos este perfume.», pero con estado 200 + `noindex` (soft-404), porque `loading.tsx` de la ficha empieza el streaming antes del `notFound()`. Se acepta por ahora; un 404 real exigiría comprobar el slug en el proxy. |
| **D-F3C-E2E** | `tests/dashboard.spec.ts` corre en el proyecto Playwright `panel`, que depende de `chromium`: crea productos reales y, en paralelo, alteraba los conteos que comprueba `flujo-compra.spec.ts`. La limpieza global borra los productos `e2e-perfume-*` y sus fotos. |

## Rediseño de la tienda — mundo «vale de entrega» (2026-11-05)

| ID | Decisión |
|---|---|
| **D-DISENO-VALE** | El cliente eligió en la ronda de impeccable la dirección asignada por el sorteo (`seed:b9febc13a07e79e8`): la tienda se lee como un **vale de pedido con copia al carbón**. Papel bond frío, tinta azul carbón, copias rosa y amarilla en bandas, cuño rosa. Sistema documentado en `DESIGN.md` + `.impeccable/design.json`; contrato en `.impeccable/surfaces/app-page-tsx.md`. `docs/design/identidad.md` y `tokens.css` quedan como histórico del sistema anterior. |
| **D-DISENO-FUENTES** | Webfonts aprobadas por el cliente: **Archivo** (variable, anchos expandidos) y **Courier Prime** (sólo cifras), OFL, subconjunto latino en `app/fonts/` vía `next/font/local`. El wordmark provisional sigue en Georgia (no se rediseña). |
| **D-DISENO-MOVIMIENTO** | Un momento firmado (el cuño que cae; en móvil espera a estar a la vista), una entrada única del vale, la pirámide que se despliega en la ficha y la capa de puntero (press 0.97, talón +2 px, foto 1.03). Sin animaciones de scroll; todo con `prefers-reduced-motion`. |
| **D-DISENO-PENDIENTE** | Stock en el vale y los talones: pendiente de decisión del cliente (el contrato público no lo expone, HU-26/27). Procedencia «diseñador / árabe»: falta el dato en el modelo. |

## F3-C2 · Disponibilidad pública y moneda (2026-11-05)

Spec: `docs/specs/2026-11-05-f3c2-disponibilidad-moneda-design.md`. Con este bloque se cierra F3-C.

| ID | Decisión |
|---|---|
| **D-F3C2-DISPONIBLE** | Decisión del cliente: **agotado automático** — un producto se ve «Agotado» si el admin lo marca o si su stock es 0. La tienda recibe sólo `Producto.disponible`; nunca cifras de stock ni el estado interno (el cliente eligió mostrar sólo «disponible / agotado»). Reglas puras en `lib/catalogo/disponibilidad.ts`. |
| **D-F3C2-VISIBLES** | La tienda muestra `activo` y `agotado`; **`descontinuado` y ocultos no aparecen** (lista, ficha, relacionados, recuentos). La ficha de un agotado muestra el botón «Agotado» desactivado; el vale de la portada sólo usa disponibles. |
| **D-F3C2-TASA** | Tabla `tasas_cambio` (migración 0003): cada cambio es una fila; la vigente es la última; se guarda quién la fijó. Sin tasa, la tienda sólo ofrece USD. El panel trabaja siempre en USD. |
| **D-F3C2-CUP** | Decisión del cliente: **CUP = round(USD × tasa)**, al peso entero. `Precio` es el único punto de conversión (D-DINERO-1) y pasa a componente de cliente que lee `MonedaContexto`. En la ficha, al ver CUP se añade «≈ X USD». |
| **D-F3C2-COOKIE** | La preferencia USD/CUP se guarda en la cookie `peache-moneda` (1 año, `SameSite=Lax`), no en `localStorage`: el servidor ya renderiza cada petición y la página llega en la moneda correcta, sin parpadeo. Valor desconocido = USD. |
| **D-F3C2-RUTA** | `app/producto/[slug]` deja `dynamicParams = false`: con CRUD los slugs cambian en tiempo de ejecución y en `next dev` daba 404 a los productos creados tras compilar. Los inexistentes, ocultos y descontinuados responden con `notFound()`. |
| **D-F3C2-CARRITO** | Límite conocido: el carrito guarda una copia del producto en `localStorage`; si se agota después, la línea se mantiene. La revalidación de precio y disponibilidad llega al confirmar el pedido (F3-D). |
| **D-F3C2-E2E** | Las suites E2E reutilizan cualquier servidor ya abierto en el puerto 3000 (`reuseExistingServer`). Contra `next dev` con 6 workers hay timeouts por compilación en caliente; se ejecutan con `--workers=2` o con el puerto libre (build de producción). |

## F3-D · Pedidos (2026-11-05)

Spec: `docs/specs/2026-11-05-f3d-pedidos-design.md`.

| ID | Decisión |
|---|---|
| **D-F3D-ESTADOS** | Confirmados por el cliente: `pendiente → confirmado → en_preparacion → en_camino → entregado` (al entregar se cobra) y `cancelado` desde cualquiera no final. Máquina pura en `lib/pedidos/estados.ts`; el panel sólo ofrece transiciones válidas. |
| **D-F3D-SALTOS** | Decisión del cliente (06/11/2026, opción A): el admin puede **saltar hacia delante** a cualquier estado posterior (p. ej. `pendiente → entregado`), no sólo al siguiente. **No se retrocede**; `entregado` y `cancelado` siguen siendo finales. Un salto deja **una sola entrada** en el historial (el estado de destino). En la ficha: botón «Marcar como «siguiente»» + «Saltar a [estado] · Cambiar estado» (pide confirmación). |
| **D-F3D-STOCK** | El stock se **reserva al crear** el pedido (transacción con `SELECT … FOR UPDATE`) y **vuelve si se cancela**. Con stock 0 el producto pasa solo a «Agotado». |
| **D-F3D-USD** | Las cuentas se llevan en USD: el pedido guarda el precio USD de cada línea. **El CUP no se congela**: siempre se muestra con la tasa vigente del panel, también en pedidos ya creados. La moneda de pago se acuerda con el cliente. |
| **D-F3D-WHATSAPP** | La web **no pide teléfono ni dirección**. Al confirmar, el cliente abre su WhatsApp con el vale ya escrito hacia el número de la tienda (`wa.me`) y pulsa Enviar: el admin recibe el pedido desde el número real del cliente. Se descartó la API de WhatsApp Business (cuenta verificada, de pago y restringida para Cuba). El número vive en `ajustes.whatsapp_tienda` (panel → Ajustes); sin él no se pueden confirmar pedidos. |
| **D-F3D-REVISION** | `/pedido` revalida el carrito en el servidor (precio, visibilidad, disponibilidad, stock) y lo vuelve a hacer dentro de la transacción; si algo cambió entre medias, no crea nada y devuelve el vale actualizado. Confirmación **idempotente** (clave única por intento). Máximo 10 unidades por línea y **3 pedidos pendientes** por cliente. |
| **D-F3D-RESTRICT** | `pedidos.usuario_id` es `ON DELETE RESTRICT`: los pedidos son contabilidad y una cuenta con pedidos no se borra. La limpieza E2E borra antes los pedidos de los usuarios de prueba y devuelve su stock. |
| **D-F3D-AJUSTES** | «Moneda» pasa a **«Ajustes»** (`/dashboard/ajustes`: WhatsApp + tasa); `/dashboard/moneda` redirige. Notificaciones del panel en `/dashboard/notificaciones` con insignias de pendientes y no leídas en la barra lateral. |

## Formato del dinero (2026-11-05)

| ID | Decisión |
|---|---|
| **D-DINERO-2** | `Intl` con «es-CU» pintaba «$47,500» y «US$50.00»: el «$» no distingue CUP de USD y la coma de miles se lee como decimal (el cliente vio 47 500 CUP como «47,5»). Todo el dinero se escribe con `lib/moneda/formato.ts`: **miles con espacio duro, coma decimal y el código de moneda visible** («47 500 CUP», «50,00 USD»). Sustituye el formato de D-DINERO-1; `Precio` sigue siendo el único punto de conversión. |

## F3-E (parcial) · Reportes de ventas (2026-11-05)

Spec: `docs/specs/2026-11-05-f3e-reportes-ventas-design.md`.

| ID | Decisión |
|---|---|
| **D-F3E-VENTA** | Decisión del cliente: **una venta es un pedido entregado** y cuenta en la fecha en que se marcó «Entregado» (`pedido_historial`). En curso = «por cobrar»; cancelado no suma. |
| **D-F3E-CUBA** | Días, semanas (lunes–domingo) y meses en **hora de Cuba** (`America/Havana`): se agrupa por claves de día en funciones puras (`lib/reportes/agregados.ts`); la consulta SQL usa un rango ensanchado ±1 día y el filtro exacto se hace en memoria. |
| **D-F3E-MONEDA** | Cifras en USD y, al lado, ≈ CUP con la tasa vigente (`ImporteDoble`). |
| **D-F3E-SIN-SQL** | Sin agregaciones SQL ni tablas nuevas: el volumen esperado (cientos de pedidos) se agrega en memoria. Revisar si crece a decenas de miles. |
