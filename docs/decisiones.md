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
| **D1** | Base de datos | **Deroga la decisión anterior («empezar sin DB»): sí hay BD y es PostgreSQL.** *(27/10/2026)* **PostgreSQL local ahora → en la nube después**: se instala en la máquina del cliente (instalación pendiente de permiso explícito) mientras dure el D4 (todo en local); migrar a la nube después = cambiar `DATABASE_URL`, el motor y el código no cambian. Se descartó Supabase por ahora: es empresa de EE.UU. y su acceso desde Cuba no pudo verificarse. |
| **D2** | Autenticación | **Login completo.** El Dashboard es **sólo del administrador** y debe: recibir **notificación cuando un cliente compre**, crear productos, eliminarlos, actualizar sus estados, llevar la economía y generar reportes. Alcance a planificar en la Fase 3. |
| **D3** | Pagos/cobro | **Pago manual + WhatsApp** — sin pasarela automática. |
| **D4** | Hosting + dominio | **Ejecución en local** por ahora; dominio y despliegue cuando el cliente compre uno. |
| **D5** | Moneda y precios | **USD como moneda base** (precios almacenados en USD). El usuario puede conmutar a **CUP**; la relación `CUP por 1 USD` la fija el **administrador en el Dashboard**. `data/productos.ts` (hoy en CUP) se migrará a USD. |
| **D7** | Contenido legal | **Pospuesto** — términos, privacidad y cookies en una fase posterior. |
| **D8** | Herramientas de testing | **Sí** — Playwright + `axe-core` (E2E y accesibilidad) y Vitest: **ya configurado el 26/10/2026** (`playwright.config.ts`, `vitest.config.ts`, 4 suites). |
| **D9** | `git init` | ✅ **Ejecutado** — repositorio inicializado en la raíz. |
| **D10** | Webfonts *(nota)* | Pendiente: hoy fuentes del sistema; `next/font/local` con WOFF2 descargado requiere aprobación. |

### Tensión técnica abierta (bloqueante para la Fase 3)

`D1` (BD en la nube) + `D2` (login completo y dashboard administrativo) + `D5` (moneda base USD) amplían el alcance **más allá de las Fases 0-2** y exigen, antes de implementar:

1. **Elección de proveedor** por parte del cliente (no auto-seleccionable).
2. **Aprobación explícita de dependencias** (SDK del proveedor) — `AGENTS.md` lo exige.
3. **Plan de Fase 3** aprobado por el cliente (dashboard, pedidos, notificaciones, reportes, cambio de moneda).

Ver también `docs/arquitectura.md` §12 (lista de pendientes).
