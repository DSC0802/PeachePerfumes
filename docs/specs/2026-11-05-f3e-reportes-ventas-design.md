# F3-E (parcial) · Reportes de ventas — Diseño

**Fecha:** 05/11/2026 · **Estado:** aprobado e implementado (05/11/2026)
**HUs:** HU-54, HU-55, HU-56, HU-57, HU-58. Fuera: emails (HU-42…44, sin servicio de correo).
**Base:** F3-D (pedidos, D-F3D-USD), F3-C2 (tasa y formato del dinero), D-F3C-SIN-VENTAS (ninguna cifra inventada).

## 1 · Decisiones del cliente (05/11/2026, no re-litigar)

| # | Decisión |
|---|---|
| 1 | **Una venta es un pedido entregado** (ya cobrado en efectivo). Cuenta en la **fecha en que se marcó «Entregado»** (historial del pedido), no en la de creación. |
| 2 | Los pedidos en curso (`pendiente`, `confirmado`, `en_preparacion`, `en_camino`) son **«pendiente de cobro»**; los cancelados no suman. |
| 3 | Cifras en **USD** (moneda de cuentas) y, al lado, su **equivalente en CUP con la tasa vigente** (se recalcula si cambia la tasa). |
| 4 | **Exportación CSV** de ventas incluida (HU-58). |

Los días, semanas y meses se cuentan en **hora de Cuba** (`America/Havana`), no en UTC: una venta de las 10 de la noche cuenta ese día.

## 2 · Resumen del panel (HU-54) — `/dashboard`
El bloque «Ventas · llega con F3-E» se sustituye por cifras reales:
- **Ventas de hoy** y **ventas del mes** (USD + ≈ CUP), con el número de pedidos entregados.
- **Por cobrar:** suma de los pedidos en curso y cuántos son.
- **Pedidos sin confirmar:** recuento de `pendiente`, con enlace a la lista filtrada.
- Mini gráfico de **ventas de los últimos 14 días** (barras por día; los días sin ventas aparecen a 0).
Sin pedidos entregados todavía, el bloque lo dice («Aún no hay ventas entregadas») en vez de mostrar ceros sueltos.

## 3 · Reportes (HU-55/56/57) — `/dashboard/reportes`
Las secciones de catálogo e inventario actuales se mantienen; encima se añade **Ventas**:
- **Período** por URL: últimos 7 días · últimos 30 días (por defecto) · este mes · mes anterior · personalizado (desde/hasta).
- **Agrupación:** por día, semana (de lunes a domingo) o mes; por defecto la que tenga sentido para el período (≤ 31 días → día; si no → semana; > 6 meses → mes).
- **Ingresos por período (HU-55):** gráfico de barras y tabla (período · pedidos · unidades · ingresos USD · ≈ CUP), con totales y **ticket medio**. Los períodos vacíos aparecen a 0.
- **Más vendidos (HU-56):** top 10 del período por unidades: producto (nombre de la línea guardada en el pedido), unidades, ingresos USD.
- **Cobrado vs pendiente (HU-57):** tres cifras para el período (por fecha de creación del pedido): cobrado (entregados), pendiente de cobro (en curso) y cancelado, cada una con nº de pedidos y USD.
- **«Exportar ventas (CSV)» (HU-58):** `/dashboard/reportes/ventas-csv?desde=…&hasta=…`, un pedido entregado por fila: número, fecha de entrega, cliente (email), artículos, total USD, ≈ CUP a la tasa de hoy. Mismo formato que el CSV de inventario (`;`, BOM UTF-8, anti-fórmulas). Protegido por el proxy y `requerirAdmin()`.

## 4 · Implementación
- **Consultas** en `lib/reportes/ventas.ts` (sólo servidor): una lectura de los pedidos entregados del período con su fecha de entrega (`pedido_historial`, estado `entregado`) y sus líneas; otra con el recuento por estado. La agrupación y los cálculos se hacen en **funciones puras** (`lib/reportes/agregados.ts`): cubos por día/semana/mes en hora de Cuba con huecos a 0, ticket medio, ranking de más vendidos, CSV. El volumen esperado (cientos de pedidos) no justifica SQL de agregación todavía.
- **Sin tablas nuevas:** todo sale de `pedidos`, `pedido_lineas` y `pedido_historial`.
- El dinero se pinta con `Precio`/`formatearImporte` (formato «47 500 CUP» / «50,00 USD»).

## 5 · Pruebas
- **Unit:** cubos por día/semana/mes con huecos y en hora de Cuba (una venta a las 23:30 de Cuba cae ese día), ticket medio, top 10, CSV, períodos predefinidos.
- **Integración Postgres:** un pedido entregado cuenta en la fecha de entrega; un pedido en curso suma a «por cobrar»; un cancelado no suma.
- **E2E:** tras entregar un pedido, el resumen y los reportes lo muestran; el CSV de ventas descarga con la cabecera esperada. Axe en reportes.

## 6 · Fuera de este bloque
Emails (HU-42…44) · reportes por cliente · márgenes y costes (no hay precio de compra en los datos).
