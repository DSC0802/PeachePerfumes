# Identidad del sistema de diseño — Peache Perfumes

Especificación visual canónica de la tienda. **Este documento manda**: `tokens.css`
implementa estos valores literalmente, `componentes.md` y `estados-y-responsividad.md`
los consumen. Si algo cambia, cambia primero aquí y después en los demás.

- **Alcance**: Fase 2 (landing `/`, catálogo `/catalogo`, ficha `/producto/[slug]`),
  preparado para evolucionar a ecommerce completo.
- **Nivel de accesibilidad objetivo**: WCAG 2.2 nivel AA (texto ≥ 4.5:1, texto grande y
  controles/interfaz ≥ 3:1, targets táctiles ≥ 44 px en móvil).
- **Idioma de interfaz**: español (toda la microcopy vive en `estados-y-responsividad.md`).

## 0. Principios (lo que decide cada valor)

1. **La foto manda**: la interfaz es un marco neutro; el rosa es acento (< 10 % de la
   superficie visible), nunca color dominante. Sin gradientes llamativos, sin adornos.
2. **Neutral cálido, no gris puro**: los neutros llevan un matiz rosado/ámbar tenue para
   que convivan con el rosa de marca y con las fotos de frascos.
3. **Un solo radio, dos sombras, tres duraciones, dos easings**: repetir un valor hasta
   que se vuelva firma; la variedad es de contenido, no de forma.
4. **Contraste medido, no estimado**: todo par de abajo fue calculado (§2).
5. **Modo oscuro derivado, no inventado**: mismos roles, mismos tokens; solo cambian los
   valores (§7).
6. **Provisional = aislado**: el wordmark y el rosa de marca viven en tokens
   `--color-brand-provisional` / `--font-brand-*` sustituibles sin tocar componentes (§1).

---

## 1. Marca provisional (`marca-provisional`)

Piezas entregadas por el cliente (NO se diseñan ni se redibujan aquí):

| Pieza | Descripción | Uso |
|---|---|---|
| Wordmark | `Peache` en serif de alto contraste, trazo rosa, remates marcados; debajo `PERFUMES` en versalitas muy espaciadas, mismo rosa; centrado, mucho aire, fondo blanco | Cabecera, pie, favicon |
| Imagotipo/monograma | Dos letras serif entrelazadas de alto contraste, mismo rosa | Placeholder de imagen, marca de agua sutil, social |

Tokens asociados (permiten sustituir la marca sin tocar componentes):

- `--color-brand-provisional`: color rosa original de la marca.
- `--font-brand-serif`: pila serif de alto contraste con la que se compone el wordmark si
  se tipografía en HTML (fallback a la tipografía de titulares).
- `--letter-spacing-brand`: `0.3em` para la línea `PERFUMES`.

**Reglas de uso**

1. El rosa de marca **no es color de UI**: nunca texto de interfaz, ni fondo de botón, ni
   borde de control. Medido: `#C9788A` sobre `--color-surface` = 3.21:1, sobre
   `--color-bg` = 3.03:1 y sobre `--color-surface-alt` = **2.76:1 (no cumple 4.5:1)**.
   Como logotipo está exento de WCAG 1.4.3, pero si se usara como texto rompería AA.
2. La UI usa la **escala de acento derivada** (`--color-accent` y familia, §3), que sí
   cumple AA en ambos modos.
3. La marca provisional se dibuja como archivo/SVG con `alt`/`aria-label`
   "Peache Perfumes"; nunca se recolorea con CSS salvo en el placeholder, donde se usa
   `--color-brand-provisional` sobre fondos claros (es decorativo, no aporta información).

---

## 2. Paleta — modo claro (`:root`)

| Token | Hex | Rol concreto |
|---|---|---|
| `--color-bg` | `#FAF8F6` | Fondo global de página |
| `--color-surface` | `#FFFFFF` | Superficies elevadas: cabecera, tarjetas, campos, sheets |
| `--color-surface-alt` | `#F1EDE9` | Bandas de sección, hover suave, fondos de agrupación |
| `--color-text` | `#1B1714` | Texto principal y titulares |
| `--color-text-muted` | `#5C554E` | Texto secundario: entradas, metadatos, ayuda |
| `--color-text-subtle` | `#6E675F` | Texto terciario: captions, notas al pie de precio |
| `--color-text-placeholder` | `#6E675F` | Placeholder de campos (token aparte aunque coincide con subtle) |
| `--color-text-disabled` | `#8B837B` | Texto/icono de controles deshabilitados |
| `--color-bg-disabled` | `#ECE7E1` | Relleno de controles deshabilitados |
| `--color-border` | `#E7E2DC` | Separadores decorativos (sin mínimo exigible) |
| `--color-border-strong` | `#867D74` | Borde de campos y controles con borde (debe cumplir ≥ 3:1) |
| `--color-border-disabled` | `#D3CCC5` | Borde de controles deshabilitados |
| `--color-accent` | `#B0485C` | Botón primario, enlaces, énfasis activo |
| `--color-accent-hover` | `#98394D` | Estado hover del acento |
| `--color-accent-active` | `#7F2F41` | Estado pressed del acento |
| `--color-accent-subtle` | `#F7EAED` | Fondo tenue de acento: badges, chips, hover de enlace |
| `--color-on-accent` | `#FFFFFF` | Texto e iconos sobre acento sólido |
| `--color-focus` | `#B0485C` | Anillo de foco (`outline`) |
| `--color-skeleton` | `#EDE8E2` | Bloques de carga (sin texto: sin mínimo) |
| `--color-overlay` | `rgba(27, 23, 20, 0.55)` | Scrim de modal/sheet |

## 3. Paleta — modo oscuro (`[data-theme="dark"]`)

| Token | Hex | Rol concreto |
|---|---|---|
| `--color-bg` | `#16130F` | Fondo global de página |
| `--color-surface` | `#1E1A17` | Superficies elevadas |
| `--color-surface-alt` | `#262119` | Bandas de sección, hover suave |
| `--color-text` | `#F2EEE8` | Texto principal y titulares |
| `--color-text-muted` | `#ABA299` | Texto secundario |
| `--color-text-subtle` | `#948B83` | Texto terciario |
| `--color-text-placeholder` | `#948B83` | Placeholder de campos |
| `--color-text-disabled` | `#746C65` | Texto/icono de controles deshabilitados |
| `--color-bg-disabled` | `#242019` | Relleno de controles deshabilitados |
| `--color-border` | `#332E29` | Separadores decorativos (sin mínimo exigible) |
| `--color-border-strong` | `#7A7169` | Borde de campos y controles con borde (≥ 3:1) |
| `--color-border-disabled` | `#332E29` | Borde de controles deshabilitados |
| `--color-accent` | `#E79AA8` | Botón primario, enlaces, énfasis activo |
| `--color-accent-hover` | `#F2AFBB` | Hover del acento |
| `--color-accent-active` | `#F7C3CC` | Pressed del acento |
| `--color-accent-subtle` | `#2E2126` | Fondo tenue de acento |
| `--color-on-accent` | `#241A1D` | Texto/iconos sobre acento sólido (aquí el acento aclarado pide texto oscuro) |
| `--color-focus` | `#E79AA8` | Anillo de foco |
| `--color-skeleton` | `#2A251F` | Bloques de carga |
| `--color-overlay` | `rgba(0, 0, 0, 0.65)` | Scrim de modal/sheet |

**Cómo se deriva**: no se invierte la marca. El fondo oscuro es el neutro cálido del modo
claro llevado a luminosidad baja (L ≈ 7 %, matiz ámbar 34°), los neutros suben de
luminosidad en el mismo orden de jerarquía, y el acento pasa de ser un rosa oscuro
(L 49 %) a un rosa claro (L 75 %) para mantener ≥ 4.5:1 sobre fondos oscuros. El
`on-accent` se invierte a oscuro (`#241A1D`) por la misma razón. Reglas obligatorias del
modo oscuro (§9) incluyen: **las fotos no se filtran** y la elevación viene de superficies
más claras, no de sombras más negras.

## 4. Estados funcionales

Mismo patrón en ambos modos: color de texto sobre su tinte de fondo.

| Rol | Claro (texto / fondo) | Oscuro (texto / fondo) |
|---|---|---|
| `--color-success` / `--color-success-bg` | `#1F7A4D` / `#E6F2EA` | `#7BCF9E` / `#17251D` |
| `--color-error` / `--color-error-bg` | `#B3261E` / `#FBEAE8` | `#F0918A` / `#2A1A18` |
| `--color-warning` / `--color-warning-bg` | `#8A5A00` / `#F8EFDF` | `#DFB15C` / `#2A2315` |
| `--color-info` / `--color-info-bg` | `#1A5B8A` / `#E7F0F7` | `#8FC0E4` / `#17222B` |

Uso: mensajes inline de formulario (error), badges de disponibilidad (success/neutral),
aviso de conexión lenta (warning), avisos informativos (info). Nunca decorativos: un
color de estado siempre va acompañado de texto o icono (nunca solo color).

## 5. Contraste verificado (medido, no estimado)

Método: luminancia relativa WCAG 2.1, calculada con el verificador disponible en el
workspace. Comando usado (un par por invocación):

```
python "C:\Users\sueir\.config\opencode\skills\applying-themes\scripts\check_contrast.py" --pair "#1B1714" "#FAF8F6"
```

Todos los ratios de abajo salieron de ese comando (cientos de invocaciones, mismo
comando con distintos pares). Umbrales: **AA texto normal ≥ 4.5:1**, **AA texto grande y
componentes de interfaz ≥ 3:1**.

### 5.1 Modo claro

| Par | Ratio | Umbral | Cumple |
|---|---|---|---|
| text `#1B1714` / bg `#FAF8F6` | 16.81:1 | 4.5 | Sí (AAA) |
| text / surface `#FFFFFF` | 17.81:1 | 4.5 | Sí (AAA) |
| text / surface-alt `#F1EDE9` | 15.29:1 | 4.5 | Sí (AAA) |
| text / accent-subtle `#F7EAED` | 15.22:1 | 4.5 | Sí (AAA) |
| text / bg-disabled `#ECE7E1` | 14.49:1 | 4.5 | Sí (AAA) |
| text-muted `#5C554E` / bg | 6.92:1 | 4.5 | Sí (AA) |
| text-muted / surface | 7.33:1 | 4.5 | Sí (AA) |
| text-muted / surface-alt | 6.29:1 | 4.5 | Sí (AA) |
| text-subtle `#6E675F` / bg | 5.26:1 | 4.5 | Sí (AA) |
| text-subtle / surface | 5.57:1 | 4.5 | Sí (AA) |
| text-subtle / surface-alt | 4.78:1 | 4.5 | Sí (AA) |
| placeholder `#6E675F` / surface | 5.57:1 | 4.5 | Sí (AA) |
| accent `#B0485C` / bg | 5.05:1 | 4.5 | Sí (AA) |
| accent / surface | 5.35:1 | 4.5 | Sí (AA) |
| accent / surface-alt | 4.59:1 | 4.5 | Sí (AA) |
| accent / accent-subtle | 4.57:1 | 4.5 | Sí (AA) |
| on-accent `#FFFFFF` / accent | 5.35:1 | 4.5 | Sí (AA) |
| on-accent / accent-hover `#98394D` | 6.94:1 | 4.5 | Sí (AA) |
| on-accent / accent-active `#7F2F41` | 8.80:1 | 4.5 | Sí (AAA) |
| accent-hover / bg | 6.55:1 | 4.5 | Sí (AA) |
| accent-active / bg | 8.31:1 | 4.5 | Sí (AAA) |
| focus `#B0485C` / bg · surface · surface-alt | 5.05 · 5.35 · 4.59 | 3.0 | Sí |
| border-strong `#867D74` / bg · surface · surface-alt | 3.81 · 4.04 · 3.47 | 3.0 | Sí |
| success `#1F7A4D` / surface · success-bg | 5.32 · 4.62 | 4.5 | Sí (AA) |
| error `#B3261E` / surface · error-bg | 6.54 · 5.61 | 4.5 | Sí (AA) |
| warning `#8A5A00` / surface · warning-bg | 5.93 · 5.19 | 4.5 | Sí (AA) |
| info `#1A5B8A` / surface · info-bg | 7.22 · 6.26 | 4.5 | Sí (AA) |
| text / success·error·warning·info-bg | 15.48 · 15.29 · 15.61 · 15.44 | 4.5 | Sí (AAA) |

### 5.2 Modo oscuro

| Par | Ratio | Umbral | Cumple |
|---|---|---|---|
| text `#F2EEE8` / bg `#16130F` | 16.02:1 | 4.5 | Sí (AAA) |
| text / surface `#1E1A17` | 14.95:1 | 4.5 | Sí (AAA) |
| text / surface-alt `#262119` | 13.83:1 | 4.5 | Sí (AAA) |
| text / accent-subtle `#2E2126` | 13.34:1 | 4.5 | Sí (AAA) |
| text-muted `#ABA299` / bg · surface · surface-alt | 7.37 · 6.88 · 6.36 | 4.5 | Sí (AA) |
| text-subtle/placeholder `#948B83` / bg · surface · surface-alt | 5.54 · 5.17 · 4.78 | 4.5 | Sí (AA) |
| accent `#E79AA8` / bg · surface · surface-alt | 8.45 · 7.89 · 7.29 | 4.5 | Sí (AAA) |
| accent / accent-subtle | 7.04:1 | 4.5 | Sí (AAA) |
| on-accent `#241A1D` / accent | 7.73:1 | 4.5 | Sí (AAA) |
| on-accent / accent-hover `#F2AFBB` | 9.37:1 | 4.5 | Sí (AAA) |
| on-accent / accent-active `#F7C3CC` | 10.99:1 | 4.5 | Sí (AAA) |
| accent-hover / bg · surface · surface-alt | 10.25 · 9.57 · 8.85 | 4.5 | Sí (AAA) |
| accent-active / bg · surface · surface-alt | 12.02 · 11.22 · 10.38 | 4.5 | Sí (AAA) |
| focus `#E79AA8` / bg · surface · surface-alt | 8.45 · 7.89 · 7.29 | 3.0 | Sí |
| border-strong `#7A7169` / bg · surface · surface-alt | 3.87 · 3.62 · 3.34 | 3.0 | Sí |
| success `#7BCF9E` / bg · success-bg `#17251D` | 9.93 · 8.54 | 4.5 | Sí (AAA) |
| error `#F0918A` / bg · error-bg `#2A1A18` | 8.04 · 7.24 | 4.5 | Sí (AAA) |
| warning `#DFB15C` / bg · warning-bg `#2A2315` | 9.33 · 7.84 | 4.5 | Sí (AAA) |
| info `#8FC0E4` / bg · info-bg `#17222B` | 9.55 · 8.33 | 4.5 | Sí (AAA) |
| text / success·error·warning·info-bg | 13.78 · 14.43 · 13.46 · 13.98 | 4.5 | Sí (AAA) |

### 5.3 Pares con resultado por debajo de AA y su justificación (declarados, no ocultos)

| Par | Ratio | Por qué no bloquea |
|---|---|---|
| text-disabled claro `#8B837B` / bg · surface · surface-alt · bg-disabled | 3.52 · 3.73 · 3.20 · 3.03 | WCAG 1.4.3 no exige contraste a componentes **inactivos**. Aun así ≥ 3:1. |
| text-disabled oscuro `#746C65` / bg · surface · surface-alt · bg-disabled | 3.59 · 3.35 · 3.10 · 3.15 | Igual que arriba. |
| brand `#C9788A` (wordmark) / surface · bg · surface-alt | 3.21 · 3.03 · **2.76** | Logotipo: exento de 1.4.3. **Regla:** el wordmark va solo sobre `--color-surface` o `--color-bg` claros, nunca sobre `--color-surface-alt`. |
| skeleton / surface (claro · oscuro) | 1.22 · 1.14 | Bloque decorativo sin texto, sin información que discriminar; no aplica 1.4.3/1.4.11. |
| border `#E7E2DC` / `#332E29` decorativos / bg | ~1.2 | Bordes de separación óptica; toda frontera **necesaria** (campo, control) usa `--color-border-strong`, que sí cumple ≥ 3:1. |

## 6. Tipografía

### 6.1 Familias (solo fuentes del sistema — cero descargas)

| Rol | Pila CSS (token) | Por qué |
|---|---|---|
| Titulares / display | `--font-serif`: `Georgia, "Iowan Old Style", "Times New Roman", "Noto Serif", serif` | Georgia es la serif de pantalla con mejor renderizado preinstalada (Windows/macOS/iOS); tiene **alto contraste de trazo y remates marcados**, el mismo carácter transicional/Didone que el wordmark. Las siguientes de la pila cubren Linux/móvil sin red. Legible a 20–64 px, que es donde la va a usar. |
| UI y textos | `--font-sans`: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Pila `system-ui`: la sans nativa de cada OS (Segoe UI, SF, Roboto). Cero peticiones, cero FOUT/CLS, la misma que usan los componentes nativos → la interfaz se siente del sistema. |

- **Por qué no una webfont**: la dirección es "rápida" y el entorno es solo fuentes del
  sistema; añadir una webfont costaría una petición, render blocking y métricas LCP.
- **Recomendación pendiente de aprobación del PM** (no implementar sin su visto bueno):
  si se quiere reforzar el carácter Didone del wordmark en titulares, candidata lógica
  sería una display serif de alto contraste tipo *Playfair Display* (Google Fonts, OFL),
  cargada con `font-display: swap` y solo para `--font-serif`. Peso y CLS pendientes de
  medir; hoy no se instala nada.

### 6.2 Escala (una sola razón: **1.25**, tercera mayor)

Base `1rem = 16px`. Pasos exactos de la razón: 16 → 20 → 25 → 31.25 → 39.06 → 48.83 →
61.04 px. Los tamaños de nivel superior se sirven con `clamp()` mobile-first cuyos
**extremos son pasos de esta escala**:

| Token | Valor | Uso |
|---|---|---|
| `--font-size-xs` | `0.75rem` (12 px) | Labels, badges, captions (con tracking amplio) |
| `--font-size-sm` | `0.875rem` (14 px) | Texto de apoyo, metadatos, ayuda de campo |
| `--font-size-body` | `1rem` (16 px) | Cuerpo, UI, botones |
| `--font-size-body-lg` | `clamp(1rem, 1.05rem + 0.4vw, 1.25rem)` (16→20) | Entradillas, descripción destacada |
| `--font-size-h4` | `clamp(1.25rem, 1.15rem + 0.5vw, 1.5625rem)` (20→25) | Subtítulos, nombre en tarjeta |
| `--font-size-h3` | `clamp(1.5625rem, 1.4rem + 0.8vw, 1.9531rem)` (25→31.25) | Títulos de sección |
| `--font-size-h2` | `clamp(1.9531rem, 1.7rem + 1.2vw, 2.4414rem)` (31.25→39.06) | Título de página |
| `--font-size-h1` | `clamp(2.4414rem, 2rem + 1.8vw, 3.0518rem)` (39.06→48.83) | Título hero de portada |
| `--font-size-display` | `clamp(3.0518rem, 2.4rem + 3vw, 3.8147rem)` (48.83→61.04) | Frase display de portada (máx. una por pantalla) |
| `--font-size-price` | `clamp(1.5625rem, 1.45rem + 0.7vw, 1.9531rem)` | Precio en ficha de producto |

Los extremos de cada `clamp` son pasos exactos de la razón 1.25 y, al ser mobile-first,
en móvil rige el mínimo (también paso de la escala). Las dos rungas por debajo de la
base (`12px` y `14px`) son tamaños utilitarios fijos de UI —no derivados de la razón—
y están limitados a labels, captions y texto de apoyo; ninguna corrección de
tamaño/zoom las necesita escalar porque todo es `rem`.

- **Pesos** (`--font-weight-*`): 400 texto, 500 etiquetas/botones, 600 énfasis y precio,
  700 reservado a display. No se usa negrita sintética sobre serif: Georgia tiene 400/700
  reales, así que el serif usa 400 y 700, y el sans 400/500/600.- **Interlineado** (`--line-height-*`): `tight 1.1` display/títulos, `heading 1.2` h2–h4,
  `body 1.6` párrafos, `relaxed 1.75` textos largos de lectura. Labels: 1.4.
- **Tracking** (`--letter-spacing-*`): `tight -0.01em` en display ≥ 39 px, `normal 0`
  en cuerpo, `wide 0.06em` en labels y versalitas, `brand 0.3em` en la línea
  `PERFUMES` del wordmark provisional.
- **Rango de tamaños de texto**: ningún texto informativo por debajo de `12px`; el texto
  de apoyo mínimo real es 14px; 12px solo con tracking amplio y mayúsculas.

## 7. Espaciado (una escala, base 4 px)

Tokens `--space-0 … --space-12`, todos múltiplos de 4:

| px | 4 | 8 | 12 | 16 | 24 | 32 | 40 | 48 | 64 | 80 | 96 | 128 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| token | `-1` | `-2` | `-3` | `-4` | `-5` | `-6` | `-7` | `-8` | `-9` | `-10` | `-11` | `-12` |

Cómo se aplica:

- **Dentro de un componente**: `4–16px` (`-1` a `-4`). Padding de botón: `12px 20px`.
  Entre icono y texto: `8px`.
- **Entre hermanos en UI** (campo + ayuda, precio + badge): `4–8px`.
  Entre tarjetas de la rejilla: `16px` móvil, `24px` ≥768, `32px` ≥1024.
- **Entre bloques de un mismo grupo** (título + rejilla): `24–32px`.
- **Entre secciones de la página**: `64px` móvil (`-9`), `80px` ≥768 (`-10`),
  `96px` ≥1024 (`-11`). Portada puede usar `-12` (128px) solo para la separación del
  hero.
- Regla de revisión: si un valor de espacio no está en la escala, no se escribe; se
  aproxima hacia abajo (más compacto) o hacia arriba (más aire) al paso más cercano.

## 8. Layout

- **Contenedores**:
  - `--container-max`: `72rem` (1152 px) — contenido por defecto.
  - `--container-narrow`: `42rem` (672 px) — textos largos (descripción de producto,
    párrafos de la portada).
  - `--container-wide`: `84rem` (1344 px) — rejilla de catálogo en escritorio ≥1280.
  - `--container-padding`: `16px` base → `24px` ≥640 → `32px` ≥1024.
- **Breakpoints mobile-first** (declarados como comentario en `tokens.css` y usados como
  `min-width` en los `@media` de componentes):

  | Nombre | Ancho | Para qué decide |
  |---|---|---|
  | base | 0 | Móvil apilado, 1–2 columnas, menú en sheet |
  | `sm` | 640px | Rejilla de 2 columnas cómoda, padding 24px |
  | `md` | 768px | Tableta: nav horizontal visible, rejilla de 3 columnas |
  | `lg` | 1024px | Escritorio: ficha a 2 columnas, rejilla de 4 columnas |

- **Rejilla de catálogo**: `2 columnas` base, `3` ≥768, `4` ≥1024; gaps según §7.
  `minmax(0, 1fr)` para que las tarjetas no desborden.
- **Cabecera persistente**: `position: sticky; top: 0`, altura `64px` móvil / `72px`
  ≥768, fondo `--color-surface`, borde inferior `--color-border`, `z-index` de nivel 100
  (token `--z-sticky`). En móvil sigue siendo sticky: no se oculta al hacer scroll
  (evita reflow y la sensación de app pesada).
- **Targets táctiles**: mínimo `44×44px` (`--touch-target`) para cualquier control en
  móvil; la regla se respeta también en escritorio para no mantener dos sistemas.

## 9. Bordes, radios y sombras

- **Un único radio en todo el sistema**: `--radius: 4px`
  (botones, campos, tarjetas, imágenes, badges, sheets, menús). Ni píldoras, ni 16px.
- **Bordes**: `1px` (`--border-width`) siempre. Frontera decorativa `--color-border`;
  frontera de control (campo, botón secundario, foco de container) `--color-border-strong`.
- **Dos sombras, máximo**, tokens `--shadow-1` y `--shadow-2`:
  - `--shadow-1`: `0 1px 2px rgb(27 23 20 / 0.06), 0 1px 1px rgb(27 23 20 / 0.04)` —
    contacto sutil: cabecera al hacer scroll, tarjeta en hover.
  - `--shadow-2`: `0 8px 24px rgb(27 23 20 / 0.10)` — flotantes: menú, sheet, modal.
  - Modo oscuro: `--shadow-1` se reduce a `0 1px 2px rgb(0 0 0 / 0.4)` y `--shadow-2` a
    `0 8px 24px rgb(0 0 0 / 0.5)`; la separación real la dan las superficies más claras
    (§10). En ningún caso sombras "dramáticas".
- **Bordes de foco**: ver §12.

## 10. Modo oscuro: cómo se deriva y reglas

Derivación (misma jerarquía, valores distintos):

1. Bajo luminosidad se desplaza el fondo cálido de 97 % a 7 % conservando matiz ámbar.
2. Superficies se ordenan por luminosidad creciente `bg → surface → surface-alt`
   (7 % → 11 % → 15 %), de modo que la elevación se lee **sin sombra**: un modal sobre
   la página es claramente más claro que el fondo.
3. Texto pasa de L≈10 % a L≈94 %; los neutros intermedios suben proporcionalmente.
4. El acento rosa se **aclara** (L 49 % → 75 %) y `on-accent` se invierte a oscuro, para
   que el botón primario mantenga ≥ 4.5:1 en ambos modos.

Reglas obligatorias:

- **Las fotos nunca se filtran**: nada de `filter: brightness()`, `invert()`,
  `opacity` reducida ni `mix-blend-mode` sobre imágenes de producto. Una foto de frasco
  con fondo claro se mantiene igual; se enmarca con `--color-surface-alt` detrás para que
  no "vibre" contra el fondo oscuro.
- **La elevación viene de superficies más claras**, no de sombras más oscuras: subir de
  `surface-alt` a `surface` antes que oscurecer el fondo bajo un componente.
- El modo oscuro se activa con `data-theme="dark"` en `<html>`; la Fase 2 debe fijar el
  valor en un script inline **antes del primer pintado** (lee `localStorage` y si no
  existe `prefers-color-scheme`) para evitar el flash de tema claro. Sin JS previo, el
  modo claro es el fallback.
- Nada de `currentColor` global: cada componente usa tokens semánticos; ambos bloques de
  `tokens.css` declaran la **misma lista de tokens** para que ningún componente "olvide"
  un valor en oscuro.

## 11. Movimiento

- **Tres duraciones** (nunca más):
  - `--duration-fast`: `150ms` — hover, color de texto, opacidad de icono.
  - `--duration-base`: `250ms` — aparición de menú, cambio de estado de control,
    transición de tema.
  - `--duration-slow`: `400ms` — entrada de sheet/modal, revelado de secciones.
- **Dos easings**:
  - `--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)` — entradas y elementos que aparecen
    (frenada suave, sin rebote).
  - `--ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)` — cambios de estado y salidas.
- **Qué se anima**: solo `transform` y `opacity`. Nada de animar `width`, `top`,
  `box-shadow` ni propiedades que pintan; nada de animación > 400ms salvo revelado de
  secciones (máximo 1 vez por sesión de página).
- **Prohibido por dirección**: gradientes animados, parallax, marquees, shimmer de
  skeleton, contador de precio, efecto de escritura, rebotes.
- **`prefers-reduced-motion: reduce`**: duraciones → `0.01ms` (regla global en
  `tokens.css`), desaparecen revelados y cualquier desplazamiento; los cambios de estado
  quedan visibles pero instantáneos. Ninguna información depende de la animación.

## 12. Foco, interacción y capas

- **Anillo de foco**: `outline: 2px solid var(--color-focus); outline-offset: 2px;`
  aplicado en `:focus-visible` a todo lo interactivo. **Nunca** `outline: none` sin
  sustituto. Ratio verificado ≥ 4.5:1 en claro y ≥ 7:1 en oscuro (§5).
- **Hover ≠ foco**: el hover solo cambia color/fondo; el anillo de foco es siempre el
  mismo y visible también con teclado en superficies oscuras y claras.
- **Estados pressed**: acento oscurecido (`--color-accent-active`), sin escala de
  `transform` en botones de formulario (solo en elementos no críticos tipo card, si se
  usa, `scale(0.99)` con `--duration-fast`).
- **`z-index`** (6 tokens: base + 5 capas): `--z-base: 0`, `--z-sticky: 100` (cabecera),
  `--z-dropdown: 200` (menú, select), `--z-overlay: 300` (scrim), `--z-modal: 400`
  (sheet/modal), `--z-toast: 500`. Nada por encima de 500; no se usan `z-index` sueltos
  fuera de tokens.

## 13. Relación entre archivos

| Archivo | Contiene | Lee de aquí |
|---|---|---|
| `identidad.md` (este) | Valores, ratios, reglas | — |
| `tokens.css` | Los mismos valores como CSS custom properties | §2, §3, §4, §6, §7, §8, §9, §11 |
| `componentes.md` | Inventario y estados de componentes | Tokens + §9, §11, §12 |
| `estados-y-responsividad.md` | Pantallas, microcopy, breakpoints | §8 + `componentes.md` |

Si un valor cambia aquí, se cambia en `tokens.css` y se revisa cualquier referencia en
los otros dos documentos. Ningún archivo de la Fase 2 debe contener un hex, un `px` de
espaciado fuera de la escala, un radio distinto de `4px` ni un `z-index` suelto.

