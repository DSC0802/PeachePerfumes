# Componentes — Peache Perfumes

Inventario cerrado de la Fase 2. Cada componente define **anatomía, tokens, variantes,
estados y accesibilidad**. Todo valor proviene de `identidad.md`/`tokens.css`: aquí no
aparecen hex, px de espaciado fuera de la escala, radios distintos de `4px` ni `z-index`
suelos.

**Cómo leer:**

- *Tokens*: referencias `--…` de `tokens.css`.
- *Estados*: `default · hover · focus-visible · active · disabled · loading`. Un
  componente implementa los estados que acepta; los no aplicables se marcan `n/a`.
- **Foco**: en todos los interactivos,
  `outline: var(--focus-width) solid var(--color-focus); outline-offset: var(--focus-offset)`
  en `:focus-visible`, salvo indicación. Nunca `outline: none` sin sustituto.

**Reglas globales**

1. Todo lo interactivo tiene target ≥ `--touch-target` (44px) en su caja, incluido en
   escritorio (un solo sistema).
2. Iconos: SVG inline, `width/height` fijo, `aria-hidden="true"`; el nombre accesible lo
   aporta el texto visible o `aria-label`. Sin fuentes de iconos, sin emoji.
3. Nada de color como único canal: estado = color + texto o icono.
4. Transiciones: solo `color`, `background-color`, `border-color`, `opacity`,
   `transform`, con `--duration-*` y `--ease-*`. Nada de animar layout.

---

## 1. Botón

**Uso**: acciones (no navegación). Si navega a otra ruta → Enlace (§3).

**Anatomía**: `<button>` → `[icono-opcional] + texto + [icono-opcional]`.

**Variantes**

| Variante | Fondo | Borde | Texto/icono | Cuándo |
|---|---|---|---|---|
| `primario` | `--color-accent` | — | `--color-on-accent` | Una por pantalla/visión: la acción principal |
| `secundario` | `--color-surface` | `--color-border-strong` | `--color-text` | Acción de apoyo (secundaria) |
| `terciario` | transparente | — | `--color-accent` | Acción baja en jerarquía ("Ver todo", "Limpiar filtros") |
| `peligro` | `--color-error` | — | `--color-on-accent` | Destrucción (Fase 2: sin acciones destructivas → reservado) |

**Tamaños**

| Tamaño | Altura | Padding | Texto |
|---|---|---|---|
| `sm` | 36px | `0 var(--space-3)` | `--font-size-sm` |
| `md` (defecto) | `--touch-target` (44px) | `0 var(--space-5)` | `--font-size-body` |
| `lg` | 48px | `0 var(--space-6)` | `--font-size-body` |

Alturas en `rem`/`px` de esta tabla son de componente (medida del control), no de
espaciado; el padding siempre sale de `--space-*`. `md` es el mínimo en móvil.

**Con/sin icono**: icono solo a la izquierda por defecto (16px, gap `--space-2`); icono
de acción de carga (spinner) a la derecha solo en estado `loading`. Icono único como
contenido solo en botones de icono (cerrar, tema), que **deben** llevar
`aria-label` + `title`.

**Estados** (variante `primario` como ejemplo):

| Estado | Implementación |
|---|---|
| `default` | `background: var(--color-accent); color: var(--color-on-accent)` |
| `hover` | `background: var(--color-accent-hover)` |
| `focus-visible` | anillo estándar (sobre `--color-accent-hover`, el anillo es `--color-focus` sobre el fondo de la página → ≥ 4.5:1) |
| `active` | `background: var(--color-accent-active)` |
| `disabled` | `background: var(--color-bg-disabled); color: var(--color-text-disabled); border-color: var(--color-border-disabled); cursor: not-allowed` — sin transición de color (evita parpadeo al pasar el cursor) |
| `loading` | texto original se mantiene en DOM con `aria-busy="true"`, se oculta visualmente, se muestra spinner + texto "Cargando…"; botón `disabled` real |
| `n/a` | `error` (un botón no tiene estado de error propio) |

`secundario`: mismo ciclo con `--color-surface` → hover `--color-surface-alt`;
`terciario`: hover `color: var(--color-accent-hover)` + `background: var(--color-accent-subtle)`.

**Accesibilidad**

- Nombre accesible = texto visible. Botón de icono: `aria-label` literal ("Cambiar a
  modo oscuro", "Cerrar").
- `loading`: `aria-busy="true"`; no cambiar el `type` ni el `name` al cargar.
- `disabled` real (`disabled` attribute). Si la acción debe explicarse, añadir texto de
  apoyo visible (§9 `estado-vacio`/`estados-y-responsividad.md`), no solo tooltip.
- Un solo `tabindex` natural: el botón va en el DOM en orden lógico (no `order` CSS
  para reordenar foco).

---

## 2. Campo de texto

**Uso**: búsqueda, formularios de contacto, cualquier entrada de texto de Fase 2+
(búsqueda del catálogo es el caso real hoy).

**Anatomía**: etiqueta arriba → control → texto de apoyo (ayuda **o** error, no ambos a
la vez).

```html
<div class="campo">
  <label for="q">Buscar</label>
  <input id="q" type="search" placeholder="Nombre del perfume"
         aria-describedby="q-ayuda" autocomplete="off">
  <p id="q-ayuda" class="campo__ayuda">Escribe al menos 2 letras.</p>
</div>
```

**Tokens**: control con `background: var(--color-surface); border: var(--border-width)
solid var(--color-border-strong); border-radius: var(--radius); color: var(--color-text);
padding: 0 var(--space-3); min-height: var(--touch-target); font: `--font-size-body`
con `--font-sans`. Placeholder: `--color-text-placeholder`. Ayuda: `--font-size-sm` +
`--color-text-muted`.

**Estados**

| Estado | Implementación |
|---|---|
| `default` | borde `--color-border-strong` (≥3:1 sobre bg) |
| `hover` | `border-color: var(--color-text-subtle)` |
| `focus-visible` | borde pasa a `--color-focus` **y** anillo estándar de foco |
| `filled` | igual a default; `color: var(--color-text)` (no usar placeholder como valor) |
| `error` | `border-color: var(--color-error); color: var(--color-text)` + mensaje `--color-error` `--font-size-sm` con icono de error y `role="alert"` |
| `disabled` | `background: var(--color-bg-disabled); color: var(--color-text-disabled); border-color: var(--color-border-disabled)` |
| `readonly` | `background: var(--color-surface-alt)` (sin `disabled`: debe poder seleccionarse/copiarse) |

**Accesibilidad**

- `<label>` real siempre (nunca solo placeholder); `for`/`id` emparejados.
- Error: `aria-invalid="true"` + `aria-describedby` apuntando al mensaje; el mensaje
  se anuncia con `role="alert"` (llega con `politeness` por defecto).
- Ayuda persistente en `aria-describedby` (que **no** se oculta al haber error: cambiar
  `textContent` apuntando al bloque o combinar ambos mensajes).
- `type` correcto (`search` en buscador → muestra `x` nativo de borrado en iOS).
- El ancho del control es 100 % del contenedor (`width: 100%`), nunca `size` de
  caracteres.

---

## 3. Enlace

**Uso**: navegación (rutas internas) y referencias. No es botón.

**Anatomía**: `<a href>` + texto. Opcional `rel="noopener"` para externo.

**Tokens**: `color: var(--color-accent)`; `text-decoration: underline;
text-decoration-thickness: 1px; text-underline-offset: 0.2em`.

**Estados**

| Estado | Implementación |
|---|---|
| `default` | `--color-accent` subrayado |
| `hover` | `color: var(--color-accent-hover)`; el subrayado **se mantiene** (no es la única pista) |
| `focus-visible` | anillo estándar |
| `active` | `color: var(--color-accent-active)` |
| `visited` | **no se altera** `color`: cambiar color en visitados rompe la regla de que acento = enlace y confunde en listas de catálogo |
| `disabled`/`loading` | n/a (si no está disponible, no se renderiza o es texto plano) |

**Enlace dentro de contenido** (párrafos): mismo tratamiento, sin cambiar a botón.

**Enlace de salto (skip link)**: primer foco de la página, texto "Saltar al contenido",
`position: absolute; left: var(--space-4); top: var(--space-4); z-index: var(--z-toast)`,
oculto con `translateY(-200%)` hasta `:focus-visible` (nunca `display:none`).

**Accesibilidad**

- Nombre por texto visible; si el enlace está en un listado repetitivo (tarjetas),
  el texto visible "Ver detalle" **dentro de la tarjeta** debe incluir el producto o
  bien usar `aria-label` con el nombre: práctica recomendada → texto visible
  "Ver detalle de {nombre}" con `sr-only` en el nombre si el diseño solo muestra
  "Ver detalle".
- Mismo destino que abre en pestaña nueva solo con indicación visible (`target="_blank"`
  + texto "(se abre en una pestaña nueva)"). Por defecto: misma pestaña.

---

## 4. Etiqueta / Badge

**Uso**: estados de producto (`Nuevo`, `Agotado`), categorías del catálogo, contadores.

**Anatomía**: `<span class="badge">` con texto corto, sin punto ni adorno (el radio es
siempre `var(--radius)`, sin excepciones).

**Tokens**: `background: var(--color-accent-subtle); color: var(--color-accent);
font: --font-size-xs con --letter-spacing-wide; padding: var(--space-1) var(--space-2);
border-radius: var(--radius); text-transform: uppercase; line-height: var(--line-height-label)`.
Pares verificados: acento sobre `--color-accent-subtle` = 4.57:1 (claro) / 7.04:1 (oscuro).

**Variantes**

| Variante | Fondo | Texto | Uso |
|---|---|---|---|
| `acento` | `--color-accent-subtle` | `--color-accent` | `Nuevo`, destacado |
| `neutral` | `--color-surface-alt` | `--color-text-muted` | Categoría en ficha |
| `success` | `--color-success-bg` | `--color-success` | Disponible |
| `error` | `--color-error-bg` | `--color-error` | Agotado |
| `info` | `--color-info-bg` | `--color-info` | Informativo |

**Estados**: solo `default` (no interactivo). Si es filtrable → se convierte en chip
`<button aria-pressed>` (ver `estados-y-responsividad.md` §2, catálogo).

**Accesibilidad**: es texto normal, se anuncia con su contexto. Un badge `error`
("Agotado") **no** depende solo del color: el texto lo dice.

---

## 5. Cabecera + Navegación + Menú móvil

**Anatomía**

```html
<header class="cabecera">
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <div class="cabecera__interior">
    <a class="logo" href="/" aria-label="Peache Perfumes — inicio">[wordmark SVG]</a>
    <nav aria-label="Principal">
      <ul>… Inicio · Catálogo …</ul>
    </nav>
    <div class="cabecera__acciones">
      [selector de tema §13] [botón menú (solo < 768px)]
    </div>
  </div>
</header>
```

- `position: sticky; top: 0; z-index: var(--z-sticky)`, fondo `--color-surface`,
  borde inferior `--color-border`, altura `--header-height` (64px → 72px ≥768).
- Interior con `max-width: var(--container-max); margin-inline: auto; padding-inline:
  var(--container-padding)` (patrón `contenedor` común a todas las pantallas).
- **Orden visual y de foco**: logo (izq.) → nav (centro) → acciones (der.). En móvil el
  orden DOM se mantiene (logo → acciones → menú), que es el orden visual.

**Navegación (Fase 2)**: `Inicio`, `Catálogo` — dos enlaces, sin mega-menú. Estado
activo: `aria-current="page"` + `color: var(--color-text)` con subrayado 2px
`--color-accent`; sin `aria-current` no se marca.

**Enlaces de catálogo > 2 elementos** (si crece): nav horizontal en ≥768px
(`display: flex; gap: var(--space-5)`) y colapsa a botón de menú por debajo de 768px.

**Menú móvil (sheet lateral)**

- Trigger: botón de icono ☰ con `aria-label="Abrir menú"`,
  `aria-expanded="false"`, `aria-controls="menu-movil"`.
- Panel: `<dialog>` (o `<div role="dialog" aria-modal="true">`) con
  `position: fixed; inset-block: 0; inset-inline-end: 0; width: min(80vw, 320px);
  background: var(--color-surface); z-index: var(--z-modal); padding: var(--space-6)`
  y scrim `--color-overlay` a `z-index: var(--z-overlay)`.
- **Focus trap** dentro del panel; al abrir: mover foco al primer enlace del panel; `Esc`
  o clic en el scrim cierran y devuelven el foco al trigger; al cerrar,
  `aria-expanded="false"`; enlaces del menú cierran antes de navegar.
- `<html>` recibe `overflow: hidden` mientras está abierto (sin scroll de fondo).
- Transición: entrada desde la derecha, `--duration-slow` + `--ease-out`; se anula con
  `prefers-reduced-motion` vía los tokens.

**Accesibilidad**

- `<nav aria-label="Principal">` único; el skip link apunta al `id="main"`.
- El selector de tema vive en la cabecera y **siempre** es visible (no se esconde en el
  menú) para poder comprobar el modo oscuro en cualquier ruta.

---

## 6. Pie

**Anatomía**

1. Bloque marca: wordmark + línea descriptiva corta ("Perfumes seleccionados con
   cuidado.", `--font-size-sm` `--color-text-muted`).
2. Bloque navegación: enlaces `Inicio`, `Catálogo` (mismas rutas que la cabecera).
3. Bloque legal/copyright: `© 2026 Peache Perfumes` (`--font-size-sm`,
   `--color-text-muted`).

**Tokens**: `background: var(--color-surface-alt); border-top: var(--border-width)
solid var(--color-border); padding-block: var(--space-8)` (64px móviles →
`var(--space-9)` ≥768); enlaces con estilo `§3`.

**Layout**: apilado en móvil (bloques con separación `--space-6`), en ≥768px en 3
columnas con `grid-template-columns: 1fr auto auto` y `gap: var(--space-6)`.

**Regla de contenido**: **no se publican datos de contacto, dirección, teléfono ni
páginas legales que no existan hoy.** Cuando el negocio entregue esos textos y rutas,
se añaden como cuarto bloque sin rediseñar el componente (espacio reservado por el
patrón de 3/4 bloques, no por un placeholder visual). Hoy el pie es exactamente lo
anterior.

**Accesibilidad**: `<footer>` con `aria-label` implícito; es contenido final del
`<body>`; sin `<nav>` redundante si solo hay 2 enlaces (basta una lista).

---

## 7. Tarjeta de producto

**Uso**: unidad repetible en portada y catálogo. Enlaza a la ficha.

**Anatomía**

```html
<article class="tarjeta">
  <a class="tarjeta__enlace" href="/producto/{slug}">
    <div class="tarjeta__media"> <img …> </div>
    <div class="tarjeta__cuerpo">
      <span class="badge">Nuevo</span>              <!-- opcional -->
      <h3 class="tarjeta__nombre">Bruma de Azahar</h3>
      <p class="tarjeta__meta">Floral · 100 ml</p>  <!-- 1 línea máx. -->
      <p class="precio precio--tarjeta"><data value="1250">$1,250.00</data></p>
    </div>
  </a>
</article>
```

**Tokens**

- Superficie: `background: var(--color-surface); border: var(--border-width) solid
  var(--color-border); border-radius: var(--radius); overflow: hidden`.
- Media: `aspect-ratio: 4 / 5; background: var(--color-surface-alt)` (respaldo si la
  foto tarda — evita saltos de layout); `img { width: 100%; height: 100%;
  object-fit: cover; display: block }`.
- Cuerpo: `padding: var(--space-4); display: grid; gap: var(--space-2)`.
- Nombre: `--font-size-h4` (20→25px), `--font-sans` 600, `line-height:
  var(--line-height-heading)`, **máx. 2 líneas** con `-webkit-line-clamp: 2` y
  `min-height: calc(2 * var(--font-size-h4) * var(--line-height-heading))` para que las
  filas de precios no bailen entre tarjetas.
- Meta: `--font-size-sm`, `--color-text-muted`.
- Precio: ver §10.

**Estados**

| Estado | Implementación |
|---|---|
| `default` | como arriba |
| `hover` | `border-color: var(--color-border-strong); box-shadow: var(--shadow-1); transform: none` (elevación sutil, sin escalar la foto) |
| `focus-visible` | anillo estándar **en la tarjeta** (`a.tarjeta__enlace:focus-visible`) |
| `active` | `background: var(--color-surface-alt)` |
| `agotado` | badge `error` "Agotado" + la tarjeta **sigue navegable**; la imagen no se atenúa más de `opacity: 0.8` y el nombre no cambia de color (si hay que destacarlo, es con el badge, no con texto deshabilitado) |
| `loading` | Skeleton (§12) con la misma caja (sin `aspect-ratio` distinto) |

**Accesibilidad**

- El enlace envuelve la tarjeta completa (target grande, un solo foco por tarjeta) —
  nunca 3 focos "Ver detalle" por fila.
- `img alt=""` **dentro** de la tarjeta: el nombre visible da el contexto (regla WCAG:
  alt redundante con el texto cercano es ruido).
- Un solo `h3` por tarjeta, en jerarquía bajo el `h1`/`h2` de la sección.
- Precio con `<data value>` (§10) para que el valor sea máquina-legible.

---

## 8. Rejilla de catálogo

**Uso**: filas de tarjetas en portada (`destacados`) y en `/catalogo`.

**Implementación**: CSS Grid, mobile-first:

```css
.rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)); /* base: 2 columnas */
  gap: var(--grid-gap);                             /* 16 → 24 → 32px (tokens responsive) */
}
@media (min-width: 768px)  { .rejilla { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .rejilla { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
```

- `minmax(0, 1fr)` evita desbordes por nombres largos.
- **1 columna** solo si el ancho útil < 320px (regla: `grid-template-columns:
  repeat(auto-fill, minmax(140px, 1fr))` como salvaguarda en pantallas <360px donde
  dos tarjetas de 140px caben, es decir `auto-fill` con mínimo 140px logra 2 col
  desde 320px útiles y nunca 1 col salvo en lo justo).
- Las tarjetas de una fila quedan alineadas en la base con `align-items: stretch` y
  el cuerpo usa `display: flex; flex-direction: column; gap` + `margin-top: auto` en
  el precio para que los precios de la fila compartan línea.
- Entre sección y rejilla: `margin-top: var(--space-5)` (título → rejilla) y
  `--section-gap` entre bloques de sección.

**Accesibilidad**: la rejilla es solo visual (no `role="grid"`); el orden DOM = orden
de lectura = orden de foco.

---

## 9. Estado vacío

**Uso**: catálogo sin productos, sección sin novedades, búsqueda/filtros sin resultados.

**Anatomía**: icono ilustrativo (SVG, 48px, `--color-text-subtle`, `aria-hidden`) →
`h2`/`p` título → texto de apoyo → acción (botón terciario o secundario).

**Tokens**: `text-align: center; max-width: var(--container-narrow); margin-inline:
auto; padding-block: var(--space-8); display: grid; gap: var(--space-3); justify-items:
center`. Título `--font-size-h3` `--color-text`; apoyo `--font-size-body`
`--color-text-muted`.

**Microcopy literal**: ver `estados-y-responsividad.md` §4 (allí está el texto exacto
por situación; aquí vive el componente).

**Estados**: solo `default` (es un estado de pantalla). Variante `inline` (dentro de
la rejilla, sin padding-block grande) para "sin resultados" sobre una página que ya
tiene filtros visibles.

**Accesibilidad**: el título del estado vacío debe ser un encabezado real (`h2`) para
que la navegación por encabezados anuncie el estado; la acción es un `<button>` o
`<a>` según haga navegación o cambio de estado en la URL.

---

## 10. Precio

**Uso**: tarjeta y ficha de producto.

**Formato** (decisión de formato, no de moneda):

```js
new Intl.NumberFormat("es-CU", { style: "currency", currency: moneda /* dato del producto */ })
```

Ejemplo con `CUP`: **`$1,250.00`**. El separador, símbolo y decimales los decide la
librería (nunca concatenar `"$" + precio`).

**Anatomía**

```html
<p class="precio"><data value="1250.00">$1,250.00</data><span class="sr-only"> CUP</span></p>
```

- `<data value>`: valor machine-readable sin depender del formato.
- La unidad se añade `sr-only` porque el símbolo `$` es ambiguo (USD/CUP/MLC) y el
  lector de pantalla no lee el formato de `Intl` como moneda.
- **Decisión para el PM**: moneda por defecto de la tienda = `CUP` (supuesto de Fase 2,
  confirmar; el dato `moneda` por producto lo permite cambiar sin tocar UI).

**Tokens**

| Variante | Token | Uso |
|---|---|---|
| `--font-size-price` + 600 + `--line-height-tight` | Ficha (§1.5) | destacado |
| `--font-size-body-lg` + 600 | Tarjeta | línea de precio |
| `--font-size-sm` + `--color-text-muted` | Nota | "Impuestos no incluidos" (solo si el negocio lo define) |

`font-variant-numeric: tabular-nums` en listas para que las columnas de precios
alineen; color `--color-text` (nunca acento: el precio no es enlace).

**Estados**: `default`; `agotado` → el precio se mantiene visible y el badge dice
"Agotado" (ocultar el precio en estado agotado es peor para comparar).

**Accesibilidad**: no cambia de tamaño al cargar (el skeleton de precio usa el mismo
alto de línea) → sin CLS.

---

## 11. Skeleton

**Uso**: sustituir el contenido mientras carga (catálogo, ficha, portada).

**Implementación**: bloques con `background: var(--color-skeleton); border-radius:
var(--radius)` y la **misma caja** que el elemento final:

| Esqueleto | Caja |
|---|---|
| Imagen de tarjeta | `aspect-ratio: 4 / 5; width: 100%` |
| Nombre | `height: 1.2em; width: 70%` |
| Precio | `height: 1em; width: 40%` |
| Ficha: título | `height: 2.4em; width: 60%` |

- **Sin shimmer de gradiente** (no hay animación de `background-position`): pulso de
  opacidad `1 → 0.55 → 1` con `animation: sk 1.2s var(--ease-in-out) infinite` donde
  `1.2s = calc(var(--duration-slow) * 3)` — derivado de la escala, no un número nuevo.
- `prefers-reduced-motion: reduce` → los tokens hacen `--duration-* ≈ 0`, pero la
  animación usa su propio `1.2s`: añadir en el CSS del componente
  `@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }` (regla
  obligatoria, documentada aquí para que Frontend la implemente).
- El contenedor lleva `aria-busy="true"` y dentro un `sr-only` "Cargando…"; los
  bloques decorativos son `aria-hidden="true"`.
- **Umbral**: el skeleton se muestra si la carga supera `200ms` (ver
  `estados-y-responsividad.md` §1); cargas instantáneas no parpadean.
- `ratio` de contraste del skeleton ~1.2:1: **decorativo, sin requisito** (declarado en
  `identidad.md` §5.3); nunca llevar texto dentro de un skeleton.

---

## 12. Modal / Sheet

**Uso**: diálogo enfocado en Fase 2 = **hoja de filtros del catálogo** (móvil) y
confirmaciones cuando existan. La hoja de filtros se detalla en
`estados-y-responsividad.md` §2; aquí el componente reutilizable.

**Anatomía**: scrim + panel. Panel `bottom-sheet` en móvil, centrado en ≥768px.

```html
<dialog class="sheet" aria-labelledby="sheet-titulo"> … </dialog>
```

**Tokens**

- Scrim: `position: fixed; inset: 0; background: var(--color-overlay);
  z-index: var(--z-overlay)`.
- Panel: `background: var(--color-surface); border-radius: var(--radius) var(--radius) 0 0`
  (móvil; `var(--radius)` completo en diálogo centrado), `box-shadow: var(--shadow-2)`,
  `z-index: var(--z-modal)`, `padding: var(--space-5)`,
  `max-height: 90dvh; overflow: auto;` y `inset-inline: 0; bottom: 0` en móvil.
  Ancho centrado: `width: min(560px, calc(100% - 2 * var(--container-padding)))`.
- Cabecera interna: título `--font-size-h3` + botón icono "Cerrar" (`aria-label`
  literal), con `border-bottom: var(--border-width) solid var(--color-border)`.
- Pie de acciones: `position: sticky; bottom: 0` con `background: var(--color-surface)`
  y `border-top` para que "Aplicar" no se pierda al hacer scroll (acciones con
  `gap: var(--space-3)`, botón primario al final).

**Estados**: `closed` (no está en DOM / `closed` en `<dialog>`) → `open` (foco
trampa) → `loading`/`error` solo si el contenido dentro tiene propios (hoja de filtros:
no aplica).

**Comportamiento / accesibilidad**

- Preferencia: `<dialog>` nativo con `showModal()` → foco atrapado y `Esc` gratis. Si
  no se usa `<dialog>`: `role="dialog" aria-modal="true"`, focus trap manual y cierre
  con `Esc` + botón visible.
- Al abrir: foco al primer elemento interactivo (o al título con `tabindex="-1"`).
- Al cerrar: devolver foco al trigger; el trigger pasa a `aria-expanded="false"`.
- Scroll de fondo bloqueado (`overflow: hidden` en `<html>`).
- `aria-labelledby` → título visible. Nunca solo `aria-label` en un diálogo con título.
- Transición: `--duration-base` + `--ease-out` (subida 16px + opacidad);
  `prefers-reduced-motion` → instantánea vía tokens.

---

## 13. Selector de tema

**Uso**: cabecera, visible en todas las rutas, ambos modos de menú.

**Anatomía**: botón de icono (`aria-label` dinámico).

```html
<button type="button" class="tema" aria-label="Cambiar a modo oscuro">
  <svg … aria-hidden="true">[luna]</svg>
</button>
```

- Icono: luna en modo claro / sol en modo oscuro (cambio instantáneo del SVG al
  activar, sin animación de rotación — con `--duration-fast` de opacidad máximo).
- **Tres estados, tres etiquetas** (`docs/decisiones.md` D-TEMA-2): el ciclo es
  `light → dark → system`, así que `aria-label` y `title` recorren los tres textos
  literales — `"Cambiar a modo oscuro"` → `"Cambiar a modo claro"` →
  `"Seguir el sistema"`. Con sólo dos textos el botón miente en el tercer paso
  (anuncia un cambio visual que no ocurre), lo que rompe WCAG 2.5.3 *Label in Name*.
  El botón **no** usa `aria-pressed` (no es un toggle con dos estados fijos: es
  "cambiar a…"), pero sí `title` con el mismo texto para escritorio.
- Target: `--touch-target` × `--touch-target` (icono 20px centrado).

**Comportamiento (Fase 2)**

1. **Anti-flash**: script inline en `<head>`, antes del primer pintado:

```html
<script>
  (function () {
    var t = localStorage.getItem("peache-theme");
    if (t !== "dark" && t !== "light" && t !== "system") t = "system";
    var dark = t === "dark" || (t !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  })();
</script>
```

2. Al pulsar: avanzar `light → dark → system`, `localStorage.setItem("peache-theme", valor)`,
   recalcular `data-theme` y `colorScheme` (en `system`, volver a consultar
   `matchMedia` y quedar suscrito a su evento `change`), y actualizar
   `aria-label`/`title`/SVG. Transición de color `--duration-base`.
3. Sin JS → modo claro (fallback declarado en `identidad.md` §10).
4. Preferencia guardada con `localStorage` clave **`peache-theme`**, valores
   **`dark` | `light` | `system`**: la misma lengua que `data-theme="dark"|"light"`
   (nada de cookies: la persistencia no requiere consentimiento). Ver
   `docs/decisiones.md` D-TEMA-1.

**Accesibilidad**: es el control que permite comprobar que la UI existe en ambos
modos; nunca se oculta bajo `display:none` en ningún breakpoint; contrastes ya
verificados para ambos modos (§5 de `identidad.md`).

---

## 14. Tratamiento de imágenes

**Por qué una sección propia**: las fotos de frasco son el protagonista; el marco debe
protegerlas (carga, recorte, modo oscuro, accesibilidad).

**Reglas (obligatorias)**

1. **Nunca filtrar**: prohibido `filter: brightness|invert|grayscale|saturate`,
   `mix-blend-mode`, `opacity < 1` y oscurecer con `::after` sobre fotos de producto en
   ningún modo. En modo oscuro las fotos se quedan idénticas; el contraste con el
   fondo se arregla con el contenedor, no con la imagen.
2. **Fondo del contenedor**: `background: var(--color-surface-alt)` detrás de toda
   foto (sirve de placeholder mientras carga y evita que el blanco del fondo de estudio
   "choque" con `--color-bg` en oscuro).
3. **Recorte**: ratio fijo por contexto — tarjeta `4/5`, miniatura de ficha `4/5`,
   imagen principal de ficha `1/1` (≥768px: columna izquierda, `object-fit: cover`),
   hero `16/9` en móvil → `3/2` ≥768px. **Nunca** estirar: siempre
   `object-fit: cover` + `object-position: 50% 40%` (el frasco queda centrado alto).
4. **Sobre-impresión de texto sobre foto: prohibida en Fase 2.** No hay imágenes con
   texto encima (ni gradientes de legibilidad): si un titular convive con una foto, va
   al lado o debajo (patrón hero dividido). Así no se necesita scrim ni se arriesga
   contraste texto/foto.
5. **`alt`**: la regla `§7` (vacío dentro de la tarjeta). En la **ficha de producto**,
   la imagen principal **sí** lleva alt descriptivo: `alt="Frasco de {nombre},
   {envase} ml"` (1.ª imagen de la galería) y `alt=""` para imágenes redundantes de la
   misma galería (vistas del mismo frasco sin texto nuevo).
6. **Carga**: `loading="lazy"` + `decoding="async"` en todas las imágenes **excepto**:
   la primera imagen visible de la portada y la imagen principal de la ficha
   (`loading="eager"`, `fetchpriority="high"` en la del hero → LCP).
7. **Dimensiones declaradas**: `width`/`height` reales (o `aspect-ratio` en CSS) en
   **todas** las imágenes → cero CLS.
8. **Responsive**: `srcset`/`sizes` con al menos dos anchos (800w, 1600w) cuando el
   backend sirva variantes; hasta entonces una sola versión ≤ 200 KB por imagen
   (presupuesto, no indicativo).
9. **Fallback de error**: `onerror` (o CSS con `img` rota) → el contenedor
   `--color-surface-alt` queda con el imagotipo provisional centrado (SVG inline,
   `--color-brand-provisional`, `aria-hidden`), sin texto de error visible: una foto
   caída no es un error del usuario. El `alt` sigue disponible para lectores.
10. **Iconografía ≠ fotos**: iconos son SVG inline (§1 global). Nunca fotos usadas como
    iconos ni iconos dentro de `<img>` con texto alterno.

---

## 15. Mapa de componentes → pantallas (Fase 2)

| Componente | `/` | `/catalogo` | `/producto/[slug]` |
|---|---|---|---|
| Cabecera + Nav + Menú | ✓ | ✓ | ✓ |
| Selector de tema | ✓ | ✓ | ✓ |
| Botón | "Ver el catálogo" | "Quitar filtros", "Aplicar" | "Añadir al carrito" (deshabilitado, §16) |
| Campo de texto | — | Buscador | — |
| Etiqueta/Badge | badge "Nuevo" en destacados | badges de estado/familia | "Nuevo"/"Agotado" |
| Enlace | nav, pie, "Ver todo" | pie | "Volver al catálogo" |
| Tarjeta | destacados (4–8) | ✓ (todas) | — |
| Rejilla | destacados | ✓ | — |
| Precio | en tarjeta | en tarjeta | variante ficha |
| Estado vacío | "Aún no hay novedades" | vacío / sin resultados | — |
| Skeleton | ✓ (destacados) | ✓ | ✓ |
| Modal/Sheet | — | hoja de filtros (móvil) | — |
| Pie | ✓ | ✓ | ✓ |

---

## 16. Decisión de la CTA de la ficha (Fase 2)

La ficha de producto muestra la acción primaria **"Añadir al carrito"** renderizada en
estado `disabled` con texto de apoyo visible: **"La compra online estará disponible
próximamente."** El carrito llega después de la Fase 2; mostrar un botón activo que no
hace nada sería peor que deshabilitarlo con explicación (regla de accesibilidad: nunca
deshabilitar sin decir por qué).

- Bloque: botón `disabled` + `<p class="campo__ayuda">` con el texto anterior.
- Si el PM decide omitir el bloque entero, se retira sin tocar el resto de la ficha.
- **Punto de revisión para el PM** (no bloquea la Fase 2).



