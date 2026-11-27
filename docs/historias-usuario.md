# Historias de Usuario — Peache Perfumes

**Fecha:** 26/10/2026 · **Origen:** decisiones D1-D10 del cliente (ver `docs/decisiones.md`)
**Formato:** «Como *rol*, quiero *acción* para *beneficio*». · ✅ = ya funciona (Fase 1-2) · 🆕 = por construir

Documento vivo: si algo no refleja lo que quieres, se corrige aquí **antes** de construir.

---

## Épica 1 — Tienda pública (visitante sin cuenta)

| ID | Historia | Estado |
|---|---|---|
| HU-01 | Como visitante, quiero navegar de la portada al catálogo para explorar perfumes. | ✅ |
| HU-02 | Como visitante, quiero buscar productos por nombre o descripción. | ✅ |
| HU-03 | Como visitante, quiero filtrar por categoría y familia olfativa. | ✅ |
| HU-04 | Como visitante, quiero ordenar el catálogo (destacados, precio, nombre). | ✅ |
| HU-05 | Como visitante, quiero ver la ficha completa de un perfume (notas, familia, precio). | ✅ |
| HU-06 | Como visitante, quiero añadir al carrito, cambiar cantidades y vaciarlo. | ✅ |
| HU-07 | Como visitante, quiero cambiar entre modo claro/oscuro/sistema. | ✅ |
| HU-08 | Como visitante, quiero ver **los precios en USD por defecto** y poder cambiar a CUP. | 🆕 (D5) |
| HU-09 | Como visitante, quiero ver si un producto está *activo*, *agotado* o *descontinuado* para no intentar comprar algo no disponible. | 🆕 (D5/D2) |

## Épica 2 — Cuentas y acceso (D2: «login completo»)

| ID | Historia | Estado |
|---|---|---|
| HU-10 | Como visitante, quiero registrarme (email y contraseña) para comprar con sesión iniciada. | ✅ (2026-10-29) |
| HU-11 | Como visitante, quiero iniciar sesión con email y contraseña. | ✅ (2026-10-29) |
| HU-12 | Como usuario, quiero cerrar sesión para proteger mi cuenta en equipos compartidos. | ✅ (2026-10-29) |
| HU-13 | Como usuario, quiero recuperar mi contraseña si la olvido. | 🆕 *(requiere servicio de email — ver Pendientes)* |
| HU-14 | Como usuario, quiero que mi sesión persista al cerrar el navegador para no reingresar cada vez. | ✅ (2026-10-29) |
| HU-15 | Como usuario, quiero ver y editar mi perfil (nombre, teléfono/WhatsApp) para que los pedidos lleguen con mis datos. | ✅ (2026-10-29) |
| HU-16 | Como administrador, quiero iniciar sesión con mi cuenta de admin para acceder al Dashboard. | ✅ (2026-10-29) |
| HU-17 | Como sistema, quiero que **sólo** el rol `admin` pueda acceder a `/dashboard`, y que el resto reciba «403 — no autorizado». | ✅ (2026-10-29) |
| HU-18 | Como cliente, quiero ver **Mis pedidos** con su estado y detalle. | 🆕 |

## Épica 3 — Productos desde el Dashboard (D2: «crear, eliminar, actualizar estados»)

| ID | Historia | Estado |
|---|---|---|
| HU-20 | Como admin, quiero ver la lista de productos con su estado y stock. | ✅ (2026-11-05) |
| HU-21 | Como admin, quiero **crear** un producto (nombre, slug, precio USD, categoría, familia, notas olfativas, stock, descripción, imágenes). | ✅ (2026-11-05) |
| HU-22 | Como admin, quiero **editar** cualquier campo de un producto existente. | ✅ (2026-11-05) |
| HU-23 | Como admin, quiero **ocultar** un producto (el «Eliminar» del Dashboard lo saca de la tienda y de la lista, pero se conserva en la BD y se puede restaurar). **Decidido 27/10/2026: ocultar, sin borrado físico.** | ✅ (2026-11-05) |
| HU-24 | Como admin, quiero cambiar el **estado** del producto: `activo` · `agotado` · `descontinuado` (propuesta: añadir `borrador`). | ✅ (2026-11-05) |
| HU-25 | Como admin, quiero subir y gestionar las imágenes del producto. | ✅ (2026-11-05) — carpeta local (D-F3C-IMAGENES) |
| HU-26 | Como sistema, quiero que el catálogo público muestre **sólo** productos `activo`. | ✅ (2026-11-05) |
| HU-27 | Como sistema, quiero que un producto `agotado` se muestre pero no pueda añadirse al carrito, con microcopy clara. | ✅ (2026-11-05) |

## Épica 4 — Compra y pedidos (D3: efectivo contra entrega · D2: compra con sesión)

| ID | Historia | Estado |
|---|---|---|
| HU-30 | Como cliente, quiero que al «Proceder al pago» se me pida iniciar sesión o registrarme si no lo hice. | ✅ (2026-11-05) |
| HU-31 | Como cliente, quiero revisar mi pedido (productos, cantidades, total) antes de confirmarlo. | ✅ (2026-11-05) |
| HU-32 | Como cliente, quiero confirmar el pedido dejando mis datos de contacto (teléfono/WhatsApp y dirección de entrega) para coordinar la entrega. | ✅ (2026-11-05) |
| HU-33 | Como sistema, quiero crear el pedido en la base de datos con estado `pendiente` y un **snapshot** de precios y tasa vigentes (el pedido no cambia si luego cambian). | ✅ (2026-11-05) |
| HU-34 | Como cliente, quiero recibir la confirmación con el número de pedido, el **total a pagar en efectivo al recibirlo** y cómo se coordinará la entrega (WhatsApp/teléfono). | ✅ (2026-11-05) |
| HU-35 | Como admin, quiero listar todos los pedidos con filtros (estado, fecha, cliente). | ✅ (2026-11-05) |
| HU-36 | Como admin, quiero ver el detalle de un pedido: cliente, productos, totales, historial. | ✅ (2026-11-05) |
| HU-37 | Como admin, quiero cambiar el estado de un pedido: `pendiente → confirmado → en_preparacion → en_camino → entregado` (al entregar se cobra; más `cancelado`). Se puede saltar hacia delante a cualquier estado posterior, sin retroceder (D-F3D-SALTOS, 06/11/2026). *Estados propuestos para el cobro contra entrega (05/11/2026), a confirmar.* | ✅ (2026-11-05) |
| HU-38 | Como cliente, quiero ver en «Mis pedidos» el cambio de estado de mi pedido. | ✅ (2026-11-05) |

## Épica 5 — Notificaciones (D2: «me llegue una notificación al dashboard + email»)

| ID | Historia | Estado |
|---|---|---|
| HU-40 | Como admin, quiero recibir una **notificación dentro del Dashboard** cada vez que un cliente crea un pedido. | ✅ (2026-11-05) |
| HU-41 | Como admin, quiero que esa notificación pueda marcarse como **leída/no leída** para no perder el control. | ✅ (2026-11-05) |
| HU-42 | Como admin, quiero recibir un **email** cuando se crea un pedido, para enterarme aunque no tenga el panel abierto. | 🆕 *(requiere servicio de email — ver Pendientes)* |
| HU-43 | Como cliente, quiero recibir email de confirmación al crear mi pedido. | 🆕 *(opcional, misma dependencia)* |
| HU-44 | Como cliente, quiero recibir aviso cuando mi pedido cambie de estado. | 🆕 *(opcional, misma dependencia)* |

## Épica 6 — Moneda, economía y reportes (D5 + «llevar la economía y todos los reportes»)

| ID | Historia | Estado |
|---|---|---|
| HU-50 | Como sistema, quiero que los precios se almacenen en **USD** (moneda base) y se pinten vía componente `Precio`. | ✅ (2026-11-05) (D5) |
| HU-51 | Como usuario, quiero conmutar USD ⇄ CUP y que mi preferencia se recuerde. | ✅ (2026-11-05) |
| HU-52 | Como admin, quiero fijar la **tasa «CUP por 1 USD»** en el Dashboard (única fuente de verdad de la conversión). | ✅ (2026-11-05) |
| HU-53 | Como sistema, quiero calcular CUP = USD × tasa al vuelo; al cambiar la tasa **sólo** cambia el equivalente en CUP, nunca los precios USD. | ✅ (2026-11-05) |
| HU-54 | Como admin, quiero ver en el panel: pedidos pendientes, ventas de hoy, ventas del mes (USD). | ✅ (2026-11-05) |
| HU-55 | Como admin, quiero ver un **reporte de ventas por período** (día/semana/mes) con totales. | ✅ (2026-11-05) |
| HU-56 | Como admin, quiero ver los **productos más vendidos** y las unidades vendidas. | ✅ (2026-11-05) |
| HU-57 | Como admin, quiero ver ingresos por estado de pedido (cobrado vs pendiente de cobro). | ✅ (2026-11-05) |
| HU-58 | Como admin, quiero **exportar** un reporte (CSV). | ✅ (2026-11-05) |

## Épica 7 — Datos e infraestructura (D1, D4, D8)

| ID | Historia | Estado |
|---|---|---|
| HU-60 | Como sistema, quiero el catálogo, usuarios y pedidos en **PostgreSQL** (proveedor por decidir — ver pregunta abierta). | 🆕 (D1) |
| HU-61 | Como sistema, quiero **migrar los 14 productos demo** a la BD como datos semilla (seed). | 🆕 |
| HU-62 | Como sistema, quiero que la capa `lib/catalogo` conmute **demo ⇄ PostgreSQL sin tocar la UI** (la frontera ya existe). | 🆕 |
| HU-63 | Como sistema, quiero los secretos en `.env.local` **fuera de git** (el `.gitignore` ya lo cubre). | ✅ |
| HU-64 | Como equipo, quiero que todo corra **en local** hasta que se compre dominio/hosting (D4). | ✅ |
| HU-65 | Como sistema, quiero tests: unitarios (lógica), E2E (flujos críticos) y accesibilidad (axe-core), en verde antes de cada entrega. | ✅ (D8) |

---

## Pendientes de definición (bloquean estimación, no el inicio)

1. **Servicio de email** (HU-13, HU-42, HU-43, HU-44): sin dominio ni proveedor no hay envío. *No se elige hasta que decidas dónde vive la infraestructura.*
2. ~~**Almacenamiento de imágenes** (HU-25)~~ → **Resuelto 05/11/2026: carpeta local** (`almacen/imagenes/`, D-F3C-IMAGENES).
3. ~~**Borrado de productos** (HU-23)~~ → **Resuelto 27/10/2026: ocultar, sin borrado físico.**
4. ~~**Alcance de exportación de reportes** (HU-58)~~ → **Resuelto 05/11/2026:** CSV de ventas e inventario.
5. ~~**Estados exactos de pedido** (HU-37)~~ → **Confirmados 05/11/2026** (D-F3D-ESTADOS).

## Fuera de alcance por decisión del cliente

- Pagos automáticos con pasarela y prepago → **D3: efectivo contra entrega**.
- Contenido legal (términos, privacidad, cookies) → **D7: pospuesto**.
- ~~Webfonts propias~~ → **D10 resuelta 05/11/2026:** Archivo y Courier Prime autoalojadas.

## Orden de construcción propuesto (se confirma al aprobar el diseño)

1. **F3-A · Datos**: esquema PostgreSQL + migraciones + seed + conmutación de `lib/catalogo` (HU-60…62).
2. **F3-B · Identidad**: registro, login, sesión, roles, rutas protegidas (HU-10…17). **Hecho 2026-10-29**.
3. **F3-C · Catálogo administrable + moneda**: CRUD de productos, estados, USD/CUP, tasa en panel (HU-20…27, HU-50…53). **Hecho 2026-11-05** (HU-20…27 y HU-50…53; spec F3-C2 para disponibilidad y moneda).
4. **F3-D · Pedidos**: checkout con sesión, estados, Mis pedidos, panel de pedidos, notificaciones in-app (HU-30…41). **Hecho 2026-11-05** (vale por WhatsApp; emails HU-42…44 pendientes de servicio).
5. **F3-E · Reportes + email**: panel económico, reportes, emails (HU-42…58). **Reportes de ventas hechos 2026-11-05** (HU-54…58); emails pendientes de servicio.

*Cada bloque se diseña, aprueba e implementa por separado; no se empieza uno sin aprobar su diseño.*
