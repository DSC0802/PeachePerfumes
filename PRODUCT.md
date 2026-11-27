# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Comprador principal:** cubano residente en Cuba que compra perfume para sí. Navega
  la tienda, elige, hace el pedido y **paga en efectivo al recibirlo** (contra entrega).
- **Administrador (dueño de la tienda):** único usuario del Dashboard. Da de alta y
  edita productos con foto, cambia estados y stock, fija la tasa CUP por USD, consulta
  reportes y, cuando existan los pedidos (F3-D), recibe aviso de cada compra.

## Product Purpose

Tienda online de perfumería para el mercado cubano. Permite descubrir y comprar
perfumes de marca originales con precios claros y stock real, y hacer el pedido sin
pagar por adelantado: se paga en efectivo en la entrega. Éxito = el cliente confía lo
bastante para pedir, recibe exactamente lo que vio y vuelve a comprar.

## Positioning

Frente al mercado informal (grupos de WhatsApp, Revolico, revendedores) Peache promete
dos cosas:

1. **Originales garantizados:** autenticidad frente a las imitaciones habituales.
2. **Entrega y trato confiables:** precio publicado, stock real (agotado se ve como
   agotado), pago contra entrega y atención personal.

*Abierto:* cómo se demuestra la autenticidad (facturas, procedencia, lote, sello…). No
se ha definido; ninguna superficie debe afirmar una prueba concreta hasta que exista.

## Operating Context

- **Catálogo:** perfumes de **marcas conocidas originales** (diseñador/nicho) y
  **perfumes árabes / alternativas** a precio más accesible. Las dos líneas conviven en
  la misma tienda.
- **Elección por notas:** cada ficha describe la pirámide olfativa (salida, corazón,
  fondo) y la familia olfativa (cítrico, floral, amaderado, oriental, frutal, acuático,
  gourmand); el catálogo filtra por familia y categoría.
- **Dinero:** precios almacenados en **USD** (moneda base); el visitante puede verlos en
  **CUP** según la tasa que fija el administrador en el Dashboard.
- **Cobro:** **efectivo contra entrega**. Sin pasarela de pago ni prepago (D3 en
  `docs/decisiones.md`, actualizada el 05/11/2026).
- **Compra con sesión:** registro e inicio de sesión con email y contraseña; el perfil
  guarda nombre y teléfono/WhatsApp para coordinar la entrega.
- **Entorno:** por ahora todo corre en local (sin dominio ni hosting); BD PostgreSQL
  local, migrable a la nube cambiando `DATABASE_URL`.

## Capabilities and Constraints

- **Hecho:** portada, catálogo con búsqueda/filtros/orden, ficha de producto, carrito,
  tema claro/oscuro/sistema, registro/login/perfil, Dashboard de administración (CRUD de
  productos con foto, estados `activo`/`agotado`/`descontinuado`, ocultar sin borrar,
  stock, reportes de inventario y CSV), catálogo público sólo con lo vendible y agotado
  no comprable (automático por stock), conmutador USD⇄CUP con la tasa del panel, pedidos
  con sesión (vale enviado al WhatsApp de la tienda), «Mis pedidos», panel de pedidos con
  estados y notificaciones, reportes de ventas (hoy, mes, por período, más vendidos,
  cobrado/por cobrar, CSV).
- **Pendiente:** emails (F3-E, sin servicio elegido), recuperación de contraseña.
- **Restricciones:** interfaz en español; sin dependencias nuevas sin aprobación del
  cliente; fotos de producto en carpeta local `almacen/imagenes/`; contenido legal
  (términos, privacidad, cookies) pospuesto; webfonts propias pendientes de aprobación
  (hoy fuentes del sistema); servicio de email sin elegir.
- **Abierto:** estados exactos de pedido (propuesta: `pendiente → confirmado →
  en_preparacion → en_camino → entregado` + `cancelado`, HU-37); zonas y condiciones de
  entrega; método de prueba de autenticidad.

## Brand Commitments

- Nombre: **Peache Perfumes**.
- Wordmark y monograma **provisionales** entregados por el cliente (no se rediseñan); el
  logotipo definitivo está pendiente. Hasta que llegue, el placeholder de imagen muestra
  el monograma `PP`.
- El rosa de marca es identidad, no color de interfaz (ver `docs/design/identidad.md`).
- Voz en español, cercana y concreta: describe el perfume con palabras («bergamota,
  cedro, vainilla») para que se sepa qué se va a oler.

## Evidence on Hand

- **No hay productos reales todavía:** los 14 perfumes de `data/productos.ts` y la
  semilla son **inventados, de demostración**. No usarlos como catálogo real ni como
  prueba de surtido.
- **No hay fotos de producto reales** (las imágenes demo apuntan a archivos inexistentes
  a propósito); el administrador las sube desde el panel.
- **No existen** testimonios, reseñas, clientes, cifras de ventas, premios ni prensa.
  No inventarlos.
- **No existe aún** prueba de autenticidad documentada; no prometer certificados,
  facturas ni sellos que no existan.
- Documentación del proyecto: `docs/decisiones.md`, `docs/historias-usuario.md`,
  `docs/arquitectura.md`, `docs/api-contracto.md`, `docs/design/*`, `docs/specs/*`.

## Product Principles

1. **Confianza antes que persuasión:** la confianza del comprador es el producto; nada
   en la tienda puede parecer el mercado informal ni prometer lo que no se puede probar.
2. **Lo que ves es lo que llega:** precio, stock y estado siempre reales; un agotado se
   muestra como agotado.
3. **Pagar al recibir:** el flujo de compra se diseña alrededor del efectivo contra
   entrega; nunca se pide pago por adelantado.
4. **Elegir por notas, no por etiquetas:** ayudar a decidir con la pirámide olfativa y
   la familia, tanto en marcas conocidas como en alternativas árabes.
5. **Ninguna cifra inventada:** donde aún no hay datos (ventas, pedidos), se dice que no
   los hay.

## Accessibility & Inclusion

- Objetivo **WCAG 2.2 AA**: texto ≥ 4.5:1, texto grande y controles ≥ 3:1, objetivos
  táctiles ≥ 44 px en móvil; verificado con axe-core en la suite de Playwright.
- Pensado para móvil y conexiones lentas (existe un aviso de conexión lenta en los
  estados de diseño).
- Color nunca como único portador de información.
