# F3-C2 · Disponibilidad pública y moneda USD ⇄ CUP — Diseño

**Fecha:** 05/11/2026 · **Estado:** aprobado e implementado (05/11/2026)
**HUs:** HU-26, HU-27 (catálogo público), HU-50, HU-51, HU-52, HU-53 (moneda). Con esto se cierra F3-C.
**Base:** spec F3-C panel admin (`2026-11-05-f3c-panel-admin-design.md`), D5 (USD base, tasa en el panel), D-DINERO-1 (el dinero sólo se pinta con `Precio`), PRODUCT.md.

## 1 · Decisiones del cliente (05/11/2026, no re-litigar)

| # | Decisión |
|---|---|
| 1 | **Agotado automático por stock:** un producto se muestra agotado si el admin lo marca `agotado` **o** si su stock es 0. |
| 2 | **El comprador sólo ve «disponible / agotado».** El stock numérico no sale del panel (el contrato público no expone cifras). |
| 3 | **CUP redondeado al peso entero** (`Math.round(usd × tasa)`), sin decimales. |
| 4 | Ya decidido en PRODUCT.md: la tienda muestra `activo` y `agotado`; **`descontinuado` y oculto no aparecen**. |

## 2 · Disponibilidad (HU-26/27)

### Contrato público (`lib/catalogo/tipos.ts`)
`Producto` gana **un solo campo**: `disponible: boolean`. No se exponen `estado` ni `stock`.

| Fila en BD | ¿En la tienda? | `disponible` |
|---|---|---|
| `oculto = true` | no | — |
| `estado = descontinuado` | no | — |
| `estado = agotado` | sí | `false` |
| `estado = activo` y `stock = 0` | sí | `false` |
| `estado = activo` y `stock > 0` | sí | `true` |

- **Postgres:** `cargarVisibles()` y `obtenerProductoPorSlug()` filtran `NOT oculto AND estado <> 'descontinuado'`; el mapeo calcula `disponible`. La URL de un descontinuado da el «no encontrado» como hoy los ocultos.
- **Demo:** todos los productos demo tienen `disponible: true` (no hay stock en `data/`).
- **Suite espejo:** el campo nuevo debe coincidir entre demo y Postgres con la semilla (todo con stock > 0).

### Comportamiento en la tienda
- **Talón:** insignia «Agotado» (ya existe la variante en `TarjetaProducto`). El orden del catálogo no cambia.
- **Ficha:** el botón queda **desactivado** con el texto «Agotado»; debajo, la microcopy «Ahora mismo no lo tenemos. Vuelve a mirar en unos días.». Sin cuño «Añadido».
- **Vale de la portada:** el producto del vale se elige entre los **disponibles**; si no hay ninguno, la portada no muestra vale.
- **Filtros y recuentos:** cuentan lo visible (disponibles + agotados).
- **Carrito:** el carrito guarda una copia del producto en `localStorage`; si después se agota, la línea **se mantiene** en esta fase. La revalidación de precio y disponibilidad se hace al confirmar el pedido (**F3-D**). Queda anotado como límite.

## 3 · Moneda (HU-50…53)

### Datos (migración `0003`)
Tabla **`tasas_cambio`**: `id` uuid · `cup_por_usd numeric(12,2) NOT NULL CHECK (> 0)` · `creada_en timestamptz` · `usuario_id → usuarios` (`ON DELETE SET NULL`). La **tasa vigente es la última fila**: cada cambio es una fila nueva, así queda el historial de quién la cambió y cuándo. No se borran filas.

### Panel (HU-52)
- Nueva sección **«Moneda»** en la barra lateral: `/dashboard/moneda`.
- Formulario «CUP por 1 USD» (número > 0, máximo 2 decimales, tope 100 000) con server action y `requerirAdmin()`.
- Debajo, una vista previa con tres precios reales del catálogo convertidos con la tasa tecleada, y el **historial** de las últimas 10 tasas (valor, fecha, quién).
- Sin tasa fijada, la sección lo dice y la tienda **no ofrece CUP**.

### Tienda (HU-51/53)
- **Conmutador USD ⇄ CUP** en la cabecera (botón de dos estados, accesible con `aria-pressed`). Sólo aparece si hay tasa.
- **Preferencia recordada en una cookie** `peache-moneda` (`usd` | `cup`, 1 año, `sameSite=lax`). Se usa cookie y no `localStorage` porque el servidor ya renderiza cada petición (D-F3B-DINAMICO): la página llega con la moneda correcta, sin parpadeo.
- **Cálculo al vuelo:** `CUP = Math.round(USD × tasa)`. Los precios USD de la BD **nunca cambian** al cambiar la tasa (HU-53).
- **`Precio` es el único punto de conversión** (D-DINERO-1). Pasa a componente de cliente que lee un `MonedaContexto` (moneda elegida + tasa vigente) que el layout raíz inicializa con la cookie y la tasa de la BD. Formato: `Intl.NumberFormat("es-CU", { style: "currency", currency: "CUP", maximumFractionDigits: 0 })` y «CUP» accesible aparte, igual que hoy con USD.
- **Equivalencia visible:** al mostrar CUP, la ficha añade la nota «≈ 60,00 USD» bajo el importe (el precio base sigue a la vista).
- El **carrito** suma en USD y pinta el total con `Precio`, así que también se convierte.
- **Panel admin:** siempre en USD (es la moneda base de los datos y de los reportes).

### Fuente demo
Con `FUENTE_CATALOGO=demo` la tasa se lee igualmente de Postgres si existe `DATABASE_URL`; si la lectura falla, no hay tasa y la tienda queda sólo en USD (sin error visible).

## 4 · Seguridad
- La acción de guardar tasa verifica `requerirAdmin()` (como todas las del panel).
- La cookie de moneda es una preferencia sin valor de seguridad; un valor desconocido equivale a `usd`.

## 5 · Pruebas
- **Unit:** visibilidad/disponibilidad (tabla de §2), conversión y redondeo CUP, validación de la tasa, lectura de la cookie.
- **Integración Postgres:** descontinuado no aparece, agotado y stock 0 dan `disponible: false`, historial de tasas (la vigente es la última). Productos de prueba creados ocultos, como en la suite actual.
- **E2E:** el admin fija la tasa → la tienda ofrece CUP → al conmutar, los precios cambian y la preferencia sobrevive a recargar; un producto con stock 0 aparece «Agotado» y no se puede añadir; un descontinuado no aparece. Axe en la ficha agotada y con CUP.

## 6 · Fuera de este bloque
Revalidar el carrito al confirmar (F3-D) · reportes en CUP (F3-E) · aviso «vuelve a estar disponible» (sin email todavía).
