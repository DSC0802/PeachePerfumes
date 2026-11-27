# F3-D · Pedidos — Diseño

**Fecha:** 05/11/2026 · **Estado:** aprobado e implementado (05/11/2026)
**HUs:** HU-30…38 (compra y pedidos), HU-40/41 (notificación en el panel). Fuera: emails HU-42…44 (sin servicio de email).
**Base:** D3 (efectivo contra entrega), D-F3C2-* (disponibilidad y moneda), PRODUCT.md («lo que ves es lo que llega», «pagar al recibir»).

## 1 · Decisiones del cliente (05/11/2026, no re-litigar)

| # | Decisión |
|---|---|
| 1 | **Estados:** `pendiente → confirmado → en_preparacion → en_camino → entregado` (al entregar se cobra) y `cancelado`. |
| 2 | **Stock:** se descuenta **al crear el pedido** (reserva) y **vuelve al stock si se cancela**. Si llega a 0, el producto pasa solo a «Agotado» (D-F3C2-DISPONIBLE). |
| 3 | **Entrega:** sin coste en la web; si lo hay, se acuerda por WhatsApp. La web lo dice. |
| 4 | **Cuentas en USD.** El pedido guarda los precios **en USD** del momento de pedir. El **CUP no se congela**: siempre se muestra con la tasa vigente del panel, también en pedidos ya creados. La moneda en que paga el cliente se acuerda en el chat. |
| 5 | **WhatsApp:** la web **no pide el teléfono**. Al confirmar, se abre el WhatsApp del cliente con **el vale ya escrito y dirigido al número de la tienda**; el cliente sólo pulsa Enviar. Así el admin recibe el pedido desde el número real del cliente. |
| 6 | **Dirección, día y moneda de pago:** todo se acuerda por WhatsApp. La web no pide dirección. |
| 7 | Ya decidido (D2/HU-30): **comprar exige sesión**. |

## 2 · Recorrido del cliente

1. **Carrito:** el botón deshabilitado «Proceder al pago» pasa a ser **«Confirmar pedido»** (`/pedido`). Sin sesión, va a `/login?next=/pedido` (HU-30).
2. **`/pedido` — revisión (HU-31):** el vale con líneas, cantidades y total. El servidor **revalida** cada línea contra el catálogo actual: precio vigente, si sigue visible y disponible, y si hay stock para la cantidad. Si algo cambió, el vale lo dice línea a línea («Ahora cuesta 65,00 USD», «Ya no está disponible: se quitará») antes de confirmar. Debajo: «Pagas en efectivo al recibirlo. La entrega y su costo, si lo hay, se acuerdan por WhatsApp.».
3. **Confirmar (HU-32/33):** acción de servidor en **una transacción**:
   - bloquea las filas de producto (`SELECT … FOR UPDATE`), comprueba visible + disponible + stock ≥ cantidad;
   - descuenta stock, crea el pedido (`pendiente`), sus líneas con **instantánea** (nombre, marca, tamaño, precio USD) y la primera entrada del historial;
   - crea la notificación del panel (HU-40);
   - **idempotente:** el formulario lleva una clave única por intento; repetir el envío devuelve el mismo pedido, sin duplicar.
   Si algo falla (stock agotado entre medias), vuelve a `/pedido` con el motivo y sin crear nada.
4. **Confirmación (HU-34) — `/pedidos/[numero]`:** número de pedido, vale y total (USD y su equivalente CUP a la tasa vigente), y el botón principal **«Enviar el vale por WhatsApp»** (`https://wa.me/<número de la tienda>?text=<vale>`). El carrito se vacía. Texto del mensaje (ejemplo):
   > Hola, soy Ana Pérez. Te envío mi pedido **Nº 0007** de Peache Perfumes:
   > 1 × Sauvage (100 ml) — 60,00 USD
   > 2 × Brisa de Coco (100 ml) — 94,00 USD
   > **Total: 154,00 USD** (≈ 50 050 CUP al cambio de hoy)
   > Pago en efectivo al recibir. Ver el pedido: http://…/pedidos/7
   Si el visitante no tiene nombre en el perfil, se usa su email.
5. **«Mis pedidos» (HU-38) — `/pedidos`:** lista propia (número, fecha, total, estado) y detalle con la **línea de estados** (cuándo pasó a cada uno). Cada cliente sólo ve los suyos; el número de otro da «no encontrado».

## 3 · Panel (HU-35/36/37, HU-40/41)

- **`/dashboard/pedidos`** (se activa en la barra lateral, con insignia de pedidos pendientes): tabla con número, fecha, cliente (nombre/email), artículos, total USD y estado. Filtros por URL: estado, desde/hasta (fecha) y búsqueda por cliente o número.
- **`/dashboard/pedidos/[numero]`:** cliente (email, nombre y teléfono del perfil si los tiene), líneas, total, historial completo (estado, fecha, quién) y **acciones sólo con las transiciones válidas**:
  desde cualquier estado no final, a **cualquier estado posterior** (el siguiente paso con el botón principal; los demás con «Saltar a…») o `cancelado`; nunca hacia atrás. `entregado` y `cancelado` son finales (D-F3D-SALTOS, 06/11/2026; antes sólo se permitía el siguiente paso). Cancelar pide confirmación y **devuelve el stock**.
- **Notificaciones (HU-40/41):** cada pedido nuevo crea una notificación. Una campana en la cabecera del panel muestra las no leídas; **`/dashboard/notificaciones`** las lista y permite marcar leída / no leída (y «marcar todas como leídas»).
- **Ajustes de la tienda — `/dashboard/ajustes`:** aquí se mueve la tasa de moneda (F3-C2) y se añade el **número de WhatsApp de la tienda** (formato internacional, sólo dígitos, p. ej. `5355551234`). Sin número configurado, la tienda **no deja confirmar pedidos** y el panel lo avisa.

## 4 · Datos (migración `0004`)

- `estado_pedido` (enum de §1.1).
- **`pedidos`**: `id` uuid · `numero` serial único (el «Nº» visible) · `usuario_id → usuarios` (restrict) · `estado` · `total_usd numeric(12,2)` · `clave_idempotencia text unique` · `creado_en` · `actualizado_en`.
- **`pedido_lineas`**: `pedido_id → pedidos` (cascade) · `producto_id → productos` (set null) · instantánea `slug`, `nombre`, `marca`, `tamano`, `precio_usd`, `cantidad` (> 0).
- **`pedido_historial`**: `pedido_id` · `estado` · `creado_en` · `usuario_id` (quién lo cambió; null = el sistema).
- **`notificaciones`**: `id` · `tipo` (`pedido_nuevo`) · `pedido_id` · `leida bool` · `creada_en`.
- **`ajustes`**: `clave text pk` · `valor text` · `actualizado_en` (de momento, `whatsapp_tienda`).
- Las cuentas de usuario con pedidos no se pueden borrar (restrict): los pedidos son contabilidad.

## 5 · Seguridad y límites
- Todas las acciones verifican sesión (cliente) o `requerirAdmin()` (panel); el proxy sigue protegiendo `/dashboard/*`. `/pedido` y `/pedidos*` exigen sesión en la propia página.
- Un cliente no puede tener **más de 3 pedidos `pendiente`** a la vez (evita el abuso de reservar stock). Al 4.º, el mensaje lo explica.
- Cantidad máxima por línea: 10 (el carrito ya lo limita en cliente; el servidor lo vuelve a comprobar).
- El enlace de WhatsApp se construye en el servidor con el número de `ajustes`; el texto va codificado (`encodeURIComponent`).

## 6 · Pruebas
- **Unit:** máquina de estados (transiciones válidas/ inválidas), revalidación del carrito (cambio de precio, no disponible, sin stock), texto del vale de WhatsApp y URL `wa.me`, validación del número.
- **Integración Postgres:** crear pedido descuenta stock en transacción; idempotencia; stock insuficiente no crea nada; cancelar devuelve stock; un cliente no ve pedidos ajenos; límite de 3 pendientes.
- **E2E:** sin sesión → login → vuelve a `/pedido`; confirma → página del pedido con enlace `wa.me` correcto y carrito vacío; «Mis pedidos» muestra el estado; el admin ve la notificación, avanza estados hasta entregado y cancela otro (el stock vuelve). Axe en `/pedido`, `/pedidos`, panel de pedidos y notificaciones.

## 7 · Fuera de este bloque
Emails (HU-42…44) · reportes de ventas (F3-E) · coste de entrega en la web · edición de un pedido ya creado (se cancela y se hace otro).
