# Estados y responsividad — Peache Perfumes

Cómo se comporta la Fase 2 cuando todo va bien, cuando no hay nada que mostrar, cuando
la red falla y cuando la pantalla cambia de tamaño. **El microcopy de aquí se implementa
literalmente** (español, sin variantes creativas).

Pantallas de la Fase 2: `/` (portada), `/catalogo`, `/producto/[slug]`.

---

## 1. Presupuestos de tiempo y comportamientos globales

| Situación | Regla concreta |
|---|---|
| Respuesta ≤ 200 ms | **Sin skeleton ni spinner**: pintar el contenido directo. Los `< 200 ms` parpadean más de lo que ayudan. |
| Respuesta > 200 ms | Mostrar el **Skeleton** de la sección (§11 de `componentes.md`), no una pantalla entera en blanco. |
| Respuesta > 20 s | Mantener el skeleton pero añadir mensaje + acción: **"Está tardando más de lo habitual."** / botón **"Reintentar"** (umbral alto a propósito: entre 2 y 20 s no se interrumpe). |
| Fallo de red / 5xx | Estado de error (§4) con **"Reintentar"** que rehace la misma petición sin recargar la página. |
| 404 de recurso (producto inexistente) | Estado 404 específico de producto (§4), nunca el 404 genérico de ruta. |
| Sin conexión (`navigator.onLine === false`) | Banner persistente bajo la cabecera (§4, "offline"). La navegación local sigue funcionando. |
| Datos llegan vacíos (colección sin items) | Estado vacío con su microcopy (§4), **no** skeleton eterno. |
| Búsqueda/filtros sin coincidencias | Estado "sin resultados" con acción de limpiar (§4). |
| Cambio de ruta (SPA) | Foco se mueve al `h1` de la nueva pantalla (`tabindex="-1"` + `focus()`), para que lectores y teclado no se queden en el pie. |
| Cambio de tema | Feedback inmediato (0 ms de espera): el color ya cambió; **sin toast**. |
| Icono/botón que tarda | `aria-busy="true"` en el contenedor + `sr-only` "Cargando…". |

**Regla de composición de estados**: una pantalla muestra **a la vez** como mucho
1 estado vacío/de error **por sección**, y la cabecera + el resto de la página siguen
visibles y navegables (salvo modal, que tapa con scrim).

**Deshabilitar con explicación**: todo control `disabled` tiene asociado texto visible
de apoyo (nunca solo tooltip ni solo color gris).

---

## 2. Pantalla `/catalogo`

### 2.1 Anatomía (siempre visible en este orden)

1. `h1` "Catálogo" (`--font-size-h2`).
2. **Buscador** (campo `§2` de `componentes.md`): `type="search"`, label visible
   "Buscar", placeholder "Nombre del perfume".
3. **Barra de resultados**: conteo (`aria-live="polite"`, `aria-atomic="true"`) +
   **selector "Ordenar"** (select nativo: "Destacados", "Nombre A→Z", "Precio: menor
   a mayor", "Precio: mayor a menor").
4. **Chips de familia** (filtros): botones `<button aria-pressed>` con la familia
   olfativa del dato (`Floral`, `Amaderado`, `Cítrico`, `Oriental`…), variante chip:
   `background: var(--color-surface); border: 1px solid var(--color-border-strong)`;
   activo: `background: var(--color-accent-subtle); color: var(--color-accent);
   border-color: var(--color-accent)`. En ≥768px se ven inline; **en móvil los chips
   viven dentro de la hoja de filtros** y el trigger es botón "Filtros" (§2.3).
5. Rejilla (§8) o estado correspondiente (§4).

**Estado en URL** (compartible y navegable con Atrás/Adelante): `?q=cedro&familia=floral&orden=precio-asc`.
Cada cambio de búsqueda/filtro escribe en la URL con `history.replaceState` para
búsqueda (no llena el historial por tecla) y `pushState` para filtros/orden.

### 2.2 Estados de resultados

| Situación | Se ve | Microcopy (literal) |
|---|---|---|
| Carga | Skeleton de rejilla | `sr-only`: "Cargando…" |
| Hay productos | Rejilla | conteo: "12 perfumes" / "1 perfume" |
| Colección vacía | Estado vacío | "El catálogo está vacío" / "Cuando publiquemos los primeros perfumes, aparecerán aquí." |
| `?q=` sin coincidencias | Estado vacío inline | "No encontramos perfumes para «cedro»." + botón terciario **"Limpiar búsqueda"** |
| Filtros sin coincidencias | Estado vacío inline | "Ningún perfume coincide con los filtros seleccionados." + botón terciario **"Quitar filtros"** |
| Ambos (q + filtros) | Estado vacío inline | "No encontramos perfumes para «cedro» con los filtros aplicados." + botón terciario **"Limpiar búsqueda y filtros"** |
| Error de red | Estado de error | "No pudimos cargar el catálogo." / "Revisa tu conexión e inténtalo de nuevo." + botón **"Reintentar"** |
| Lento (> 20 s) | Skeleton + aviso | "Está tardando más de lo habitual." + botón **"Reintentar"** |

Al limpiar búsqueda/filtros: la URL queda limpia, la rejilla se repinta, el foco va al
campo de búsqueda (o al `h1` si el campo ya no es el origen del foco).

### 2.3 Hoja de filtros (solo < 768 px)

- Trigger: botón **"Filtros"** con contador de filtros activos ("Filtros · 2") y
  `aria-expanded`.
- Panel: componente Sheet (§12): título "Filtros", chips agrupados por familia, botón
  secundario **"Quitar filtros"** + botón primario **"Ver 8 perfumes"** (conteo en vivo,
  `aria-live="polite"`) en pie sticky.
- Cierre: `Esc`, scrim, o botón "X" (`aria-label="Cerrar filtros"`). Foco devuelto al
  trigger. Aplicar cierra y mantiene el foco en el trigger.

---

## 3. Pantalla `/` y pantalla `/producto/[slug]`

### 3.1 `/` (portada)

| Situación | Se ve |
|---|---|
| Primera visita | Todo el contenido (sin login, sin onboarding, sin cookie banner: no hay cookies). Tema: guardado → si no, `prefers-color-scheme` → si no, claro. |
| Sección destacados cargando | Título visible + skeleton de rejilla bajo él (la sección nunca se oculta entera). |
| Sin productos publicados (hero + destacados) | Hero completo + estado vacío en la sección de destacados: "Aún no hay novedades" / "La primera selección estará disponible muy pronto." + botón secundario **"Ver el catálogo"** (que mostrará el estado vacío de §2). |
| Error de red en destacados | Estado de error solo en esa sección (el hero es estático, no falla): "No pudimos cargar el catálogo." + **"Reintentar"**. |
| Conexión offline | Banner bajo cabecera + contenido cacheado si lo hay; si no, estado de error de la sección. |

Estructura mobile-first: **hero** (frase display `--font-size-display` + `h1` "Peache
Perfumes"? — no: el `h1` de portada es la frase, el wordmark es imagen con `alt`) →
**destacados** (rejilla 4–8 tarjetas) → **frase de marca / tratamiento de imágenes**
(sección editorial con 1 imagen `3:2` y texto al lado) → pie. Sin carrusel.

### 3.2 `/producto/[slug]`

| Situación | Se ve |
|---|---|
| Carga | Skeleton de ficha: media `1/1`, `h1`, líneas de texto, bloque de precio (misma caja final) |
| Producto encontrado | Ver anatomía ↓ |
| Slug inexistente / borrado | Estado 404: "No encontramos este perfume." / "Puede que se haya retirado o que el enlace no sea correcto." + botón secundario **"Ver el catálogo"** |
| Error de red | "No pudimos cargar este perfume." + **"Reintentar"** |
| Agotado | Badge `error` "Agotado" junto al precio; CTA primaria deshabilitada (§16 de `componentes.md`) |
| Imagen principal caída | Contenedor `--color-surface-alt` con imagotipo centrado (sin texto de error) |

**Anatomía (mobile-first, apilado)**

1. Migas: `Inicio / Catálogo / {nombre}` (enlaces `§3`, último en texto plano).
2. Galería: imagen principal `1/1` + thumbnails (44×44) debajo, `object-fit: cover`.
3. `h1` nombre (`--font-size-h1`) + badge.
4. Meta (familia · envase) `--font-size-sm --color-text-muted`.
5. Precio (variante ficha, `§10`) + CTA (§16) + ayuda.
6. Descripción (`--container-narrow`, `--line-height-relaxed`).

**Responsive**

| Ancho | Comportamiento |
|---|---|
| < 640 px | Apilado; galería ocupa el ancho útil; thumbnails scroll horizontal |
| 640–1023 px | Igual, con más aire (`--space-6` entre bloques) |
| ≥ 1024 px | 2 columnas `1.1fr / 0.9fr`: izquierda galería **sticky** (`position: sticky; top: calc(var(--header-height) + var(--space-5))`), derecha compra + descripción |

---

## 4. Microcopy de estados (canon — español, textos exactos)

Los textos de §2 y §3 son instancias de esta tabla; **la palabra es la tabla**.
Marcadores entre llaves se rellenan con datos reales. Tono: cercano, directo, sin
disculpas largas ni jerga técnica.

### 4.1 Carga

| Situación | Texto |
|---|---|
| Cargando (sr-only, `aria-live="polite"`) | `Cargando…` |
| Tardío (> 20 s) | Título `Está tardando más de lo habitual.` · acción `Reintentar` |

### 4.2 Vacíos

| Situación | Título | Apoyo | Acción |
|---|---|---|---|
| Portada sin novedades | `Aún no hay novedades` | `La primera selección estará disponible muy pronto.` | `Ver el catálogo` (secundario) |
| Catálogo sin productos | `El catálogo está vacío` | `Cuando publiquemos los primeros perfumes, aparecerán aquí.` | — |
| Búsqueda sin resultados | `No encontramos perfumes para «{q}».` | — | `Limpiar búsqueda` (terciario) |
| Filtros sin resultados | `Ningún perfume coincide con los filtros seleccionados.` | — | `Quitar filtros` (terciario) |
| Búsqueda + filtros sin resultados | `No encontramos perfumes para «{q}» con los filtros aplicados.` | — | `Limpiar búsqueda y filtros` (terciario) |

### 4.3 Errores

| Situación | Título | Apoyo | Acción |
|---|---|---|---|
| Error de red (cualquier sección) | `No pudimos cargar el catálogo.` | `Revisa tu conexión e inténtalo de nuevo.` | `Reintentar` |
| Error en la ficha | `No pudimos cargar este perfume.` | `Revisa tu conexión e inténtalo de nuevo.` | `Reintentar` |
| 404 de producto | `No encontramos este perfume.` | `Puede que se haya retirado o que el enlace no sea correcto.` | `Ver el catálogo` (secundario) |
| 404 de ruta | `Esta página no existe.` | `Comprueba la dirección o vuelve al inicio.` | `Ir al inicio` (secundario) |
| Sin conexión | `Sin conexión. Algunos datos podrían no estar disponibles.` | — | `Reintentar` (en el banner) |

- Los errores de formulario **van junto al campo** (§2 de `componentes.md`), con
  mensajes que nombran la corrección, p. ej. `Escribe al menos 2 letras para buscar.`
  — no `Campo obligatorio` sin decir cuál.
- Un error de sección **no** sustituye a la página: la cabecera, el `h1` y el pie
  siguen ahí.

### 4.4 Avisos y confirmaciones no tostables

| Situación | Comportamiento y texto |
|---|---|
| Banner offline | Texto de §4.3, `background: var(--color-warning-bg); color: var(--color-warning)` + icono, `role="status"`, anclado bajo la cabecera. Al volver la conexión se auto-oculta (sin pedir confirmación). |
| Cambio de tema | Sin toast. Feedback = el cambio en sí (inmediato). |
| Orden/filtro aplicado | Sin toast: la rejilla y el conteo (`aria-live`) se actualizan; el propio resultado es el feedback. |
| Vaciar búsqueda | Sin confirmación: es reversible escribiendo otra vez. |

### 4.5 Textos de interfaz que acompañan a los estados

| Elemento | Texto |
|---|---|
| Skip link | `Saltar al contenido` |
| Menú móvil: abrir | `aria-label="Abrir menú"` |
| Menú móvil: cerrar | `aria-label="Cerrar filtros"` / `aria-label="Cerrar menú"` |
| Tema (modo claro → oscuro) | `aria-label="Cambiar a modo oscuro"`; invertido en oscuro |
| Buscador | Label `Buscar`; placeholder `Nombre del perfume` |
| Orden | Label `Ordenar` |
| Filtros (móvil) | Trigger `Filtros` · con activos `Filtros · {n}` · limpiar `Quitar filtros` · aplicar `Ver {n} perfumes` |
| CTA ficha deshabilitada | `Añadir al carrito` + apoyo `La compra online estará disponible próximamente.` |
| Pie: línea de marca | `Perfumes seleccionados con cuidado.` |

---

## 5. Responsividad (mobile-first)

### 5.1 Breakpoints y qué decide cada uno

| `min-width` | Nombre | Decide |
|---|---|---|
| 0 | base | Móvil apilado, menú en sheet, hoja de filtros, rejilla 2 col |
| 640px | `sm` | Padding 24px, rejilla 2 col holgada, hero con más aire |
| 768px | `md` | Nav horizontal visible, rejilla 3 col, header 72px, filtros inline, ficha con más aire |
| 1024px | `lg` | Rejilla 4 col, ficha 2 columnas con galería sticky, `--container-wide` disponible |

Los tokens de layout (`--container-padding`, `--header-height`, `--grid-gap`,
`--section-gap`) **cambian solos** en `tokens.css`; los componentes solo responden a
los 4 `min-width`.

### 5.2 Comportamiento por pantalla

| | `/` | `/catalogo` | `/producto/[slug]` |
|---|---|---|---|
| < 640px | Hero apilado (frase arriba, imagen `3:2` debajo, **sin texto sobre foto**), destacados 2 col, 1 col por debajo de 320px útiles | Buscador + trigger `Filtros` + conteo; rejilla 2 col; chips solo en hoja | Galería `1/1` a ancho completo + thumbnails scroll-x; todo apilado |
| 640–1023px | Rejilla 2–3 col según hueco, padding 24px | Rejilla 3 col desde 768px; chips inline desde 768px | Apilado con `--space-6` entre bloques |
| ≥ 1024px | Rejilla 4 col, secciones editoriales en 2 col (imagen 55% / texto 45%) | Rejilla 4 col, chips + orden en una fila con buscador | 2 columnas, galería sticky |

### 5.3 Reglas transversales

1. **Nada solo-hover**: todo lo que hace el hover se puede hacer con foco y, en móvil,
   con tap (targets 44px).
2. **Sin zoom de texto roto**: todo tamaño en `rem`/`clamp`; la página soporta `zoom`
   del navegador al 200 % y el texto de 12px mínimo no se agranda por encima de su rol
   (se re-flowa; nada se corta ni se superpone).
3. **Línea de texto**: máximo ~65 caracteres en lectura (`--container-narrow`); ningún
   texto a ancho completo en escritorio.
4. **Objetivos táctiles**: 44px mínimo; separación ≥ 8px entre objetivos contiguos
   (`--space-2`).
5. **Sticky solo en cabecera** (y galería de ficha ≥1024px): no hay segunda barra
   sticky en Fase 2 (evita solaparse con la cabecera y duplicar `z-index`).
6. **Orientación**: sin bloqueo por orientación.
7. **`dvh`/`svh`** para alturas de sheet/modal en móviles con barra de navegador
   (`max-height: 90dvh`).
8. **Impresión**: no es objetivo de Fase 2; si acaso, `@media print` oculta cabecera,
   pie y CTA (regla, no requisito).

---

## 6. Checklist de estados (antes de dar por buena una pantalla)

- [ ] Carga rápida (< 200 ms) → sin skeleton de por medio.
- [ ] Carga lenta → skeleton con la caja final (cero CLS) y luego contenido.
- [ ] Datos vacíos → microcopy de §4.2, no blanco.
- [ ] Error → §4.3 + `Reintentar` funcional, resto de la página sigue usable.
- [ ] 404 de producto ≠ 404 de ruta.
- [ ] Búsqueda/filtros sin resultados → microcopy con `«{q}»` real y acción de limpiar.
- [ ] Estado en URL (Atrás/Adelante restauran búsqueda, filtros y orden).
- [ ] Foco tras navegación SPA → `h1`.
- [ ] Cada `disabled` tiene apoyo visible.
- [ ] Ambos temas: mismos textos, ratios ya verificados (`identidad.md` §5).
- [ ] 320px / 375px / 768px / 1024px / 1440px sin scroll horizontal.

