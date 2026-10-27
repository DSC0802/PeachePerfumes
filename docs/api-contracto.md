# Contrato de API — Peache Perfumes (FUTURO)

**Fecha:** 24/10/2026 · **Autor:** agente `architect` · **Estado:** especificación, NO implementada
**Relacionado con:** `docs/arquitectura.md` (frontera de abstracción de datos, sección 6.4)

---

## 0. Qué está implementado hoy: NADA DE ESTO

> **Este documento describe una API que todavía no existe.**
>
> En el workspace **no hay ningún Route Handler, ningún endpoint, ninguna base de datos, ninguna autenticación ni ninguna pasarela de pago.** Bajo `app/api/` no hay (ni debe haber) nada. No se hace ninguna petición `fetch` a ninguna URL de este contrato.
>
> La Fase 2 del frontend funciona con **datos de demostración ficticios** importados localmente desde `data/` y expuestos a la UI a través de `lib/catalogo/` (ver `docs/arquitectura.md` §6). Este contrato se documenta ahora para que el día que exista backend **la interfaz no se reescriba**: la UI ya consume la forma de datos que aquí se especifica.
>
> **Regla:** este archivo es especificación y guía de futura implementación. Nada de lo que sigue debe auto-implementarse sin aprobación explícita.

### 0.1 Qué hace hoy la Fase 2 y cómo respeta este contrato

| Punto del contrato | Equivalente hoy en Fase 2 | Se respeta porque |
|---|---|---|
| `GET /api/v1/productos` | `catalogo.listarProductos(filtro)` con import estático | Misma forma de `Producto`, mismo filtrado, mismos valores de `orden` |
| `GET /api/v1/productos/{slug}` | `catalogo.obtenerProductoPorSlug(slug)` → `null` si no existe | La página llama a `notFound()` (HTTP 404) igual que el endpoint devolvería 404 |
| `GET /api/v1/categorias` | `catalogo.listarCategorias()` | Devuelve `Categoria[]` idéntica a `data` del endpoint |
| Relacionados | `catalogo.listarRelacionados(slug, limite)` | Equivale a `GET /api/v1/productos?relacionados_a={slug}` (ver §2) |
| `query` del endpoint | `ProductoFiltro { categoria, busqueda, orden }` | `ProductoFiltro` es espejo de los query params (arquitectura §6.1) |
| Respuesta `Producto` | tipo `Producto` de `lib/catalogo/tipos.ts` | El tipo de dominio **es** el `ProductoApi`; ver §1.3 |
| Errores | estados `null` y `notFound()` | No hay errores de red que manejar en Fase 2 |
| Carrito y pedidos | **no existen** | Fuera de alcance de Fase 2 |

**Mapeo obligatorio para el agente `frontend`:** la única puerta permitida hacia los datos demo es `@/lib/catalogo`. Ejemplo correcto en una página:

```ts
import { catalogo } from "@/lib/catalogo";
import { formatearPrecio } from "@/lib/dinero";

export default async function CatalogoPage({ searchParams }: Props) {
  const { categoria, q, orden } = await searchParams;
  const productos = await catalogo.listarProductos({
    categoria: typeof categoria === "string" ? categoria : undefined,
    busqueda: typeof q === "string" ? q : undefined,
    orden: orden as ProductoFiltro["orden"],
  });
  // ...render
}
```

### 0.2 Qué NO hacer hoy

1. No crear `app/api/**` ni archivos `route.ts`.
2. No escribir `repositorio-api.ts` ni llamadas `fetch` a estas URLs (código muerto que nadie probará).
3. No inventar servidor, BD, ni variables de entorno de conexión.
4. No citar este contrato en la UI (ni «API», ni «próximamente disponible»).

---

## 1. Convenciones generales (válidas para todos los endpoints)

### 1.1 Transporte y formato

| Regla | Valor |
|---|---|
| Prefijo | `/api/v1` (versión en la ruta; cambios incompatibles → `/api/v2`) |
| Cuerpo | `application/json; charset=utf-8` en request y response |
| Codificación | `UTF-8` sin BOM |
| Nombres de campo | `camelCase` en todos los JSON (request y response) |
| Fecha y hora | ISO 8601 con zona, p. ej. `2026-10-24T15:30:00-05:00` (Cuba, UTC−5) |
| Identificadores | string opaco. Demo local `p001`; API real: `uuid` o `cuid` |
| Números | JSON `number`; sin comas ni formato de miles dentro del JSON |
| Idioma de los mensajes de error | `es` |
| HTTP | códigos estándar; el cuerpo de error siempre sigue §5.1 |

### 1.2 Endpoints previstos (índice)

| Método | Path | Propósito | Auth | Fase |
|---|---|---|---|---|
| `GET` | `/api/v1/salud` | health check | no | 3 |
| `GET` | `/api/v1/categorias` | listado de categorías | no | 3 |
| `GET` | `/api/v1/productos` | catálogo con filtros y paginación | no | 3 |
| `GET` | `/api/v1/productos/{slug}` | ficha de producto | no | 3 |
| `GET` | `/api/v1/carrito` | carrito actual | carrito invitado o sesión | 3 |
| `POST` | `/api/v1/carrito/lineas` | añadir producto | carrito invitado o sesión | 3 |
| `PATCH` | `/api/v1/carrito/lineas/{lineaId}` | cambiar cantidad | carrito invitado o sesión | 3 |
| `DELETE` | `/api/v1/carrito/lineas/{lineaId}` | quitar línea | carrito invitado o sesión | 3 |
| `DELETE` | `/api/v1/carrito` | vaciar carrito | carrito invitado o sesión | 3 |
| `POST` | `/api/v1/pedidos` | crear pedido | carrito invitado o sesión | 4 |
| `GET` | `/api/v1/pedidos` | listar mis pedidos | `Authorization` | 5 |
| `GET` | `/api/v1/pedidos/{pedidoId}` | detalle de pedido | `Authorization` | 5 |

### 1.3 Forma de `Producto` en la API (`ProductoApi`)

Idéntica al tipo `Producto` de `lib/catalogo/tipos.ts` (`docs/arquitectura.md` §6.1). **No hay campos extra ni de menos**: ésa es la garantía de que el repositorio demo y el futuro repositorio API son intercambiables.

```json
{
  "id": "9f2c1a70-4b3e-4d6a-8f21-0c5d7e9a1b23",
  "slug": "brisa-de-coco-100",
  "marca": "Casa Palma",
  "nombre": "Brisa de Coco",
  "tamano": "100 ml",
  "tamanoMl": 100,
  "precio": 2500,
  "moneda": "CUP",
  "descripcion": "Fresca, luminosa y ligera: una salida cítrica que se asienta sobre un corazón floral y un fondo cremoso de coco y sándalo.",
  "notas": {
    "salida": ["Bergamota", "Limón verde"],
    "corazon": ["Jazmín", "Flor de azahar"],
    "fondo": ["Coco", "Sándalo", "Almizcle blanco"]
  },
  "imagen": {
    "src": "/productos/brisa-de-coco.webp",
    "alt": "Frasco de Brisa de Coco de 100 ml sobre fondo arena"
  },
  "categoriaId": "mujer",
  "destacado": true,
  "novedad": false
}
```

`Categoria`:

```json
{
  "id": "mujer",
  "slug": "mujer",
  "nombre": "Mujer",
  "descripcion": "Perfumes tradicionalmente destinados al público femenino."
}
```

### 1.4 Envoltura de respuesta

- **Recurso único:** objeto directo, sin envoltura: `{ ...producto }`.
- **Listados:** siempre `{ "data": [...], "meta": {...} }`.
- **Errores:** siempre `{ "error": { ... } }` (definición en §5.1). Nunca un error dentro de `data`.
- **`meta` de paginación:**

```json
{
  "data": [],
  "meta": {
    "pagina": 1,
    "limite": 12,
    "total": 47,
    "totalPaginas": 4
  }
}
```

### 1.5 Identidad del carrito (invitado)

- El cliente genera un `carritoId` (UUID v4) una sola vez y lo guarda en `localStorage` bajo la clave `peache-carrito-id`.
- Se envía en **todas** las peticiones de carrito y de creación de pedido en la cabecera `X-Carrito-Id: <uuid>`.
- Si falta o es inválido → `400` con código `carrito_id_invalido`.
- Cuando exista sesión de usuario, el servidor fusiona el carrito de invitado con el del usuario en el momento del login (comportamiento a definir en la fase de autenticación; aquí sólo se deja previsto el mecanismo de identificación).

### 1.6 Autenticación (futura)

- Cabecera `Authorization: Bearer <token>` (JWT de acceso, TTL corto + refresh).
- Sólo la necesita `GET /api/v1/pedidos*`. Catálogo, producto y carrito de invitado son públicos.
- `401` sin token o caducado; `403` con token válido pero sin permiso.

### 1.7 Idempotencia

- `POST /api/v1/pedidos` exige la cabecera `Idempotency-Key: <uuid>` (generado por el cliente, uno por intento de compra).
- Repetición con la misma clave + mismo cuerpo → devuelve **200** con el pedido ya creado (no duplica).
- Repetición con la misma clave + cuerpo distinto → `409` con codigo `idempotencia_conflicto`.

---

## 2. Catálogo y producto

### 2.1 `GET /api/v1/salud`

Comprobación de que el servicio responde. Útil para smoke tests y monitorización.

**Response `200`**

```json
{
  "estado": "ok",
  "version": "1.0.0",
  "timestamp": "2026-10-24T15:30:00-05:00"
}
```

### 2.2 `GET /api/v1/categorias`

Devuelve todas las categorías activas, ordenadas por el campo `orden` del servidor.

**Query:** ninguna.

**Response `200`**

```json
{
  "data": [
    { "id": "mujer", "slug": "mujer", "nombre": "Mujer", "descripcion": "Perfumes tradicionalmente destinados al público femenino." },
    { "id": "hombre", "slug": "hombre", "nombre": "Hombre", "descripcion": "Perfumes tradicionalmente destinados al público masculino." },
    { "id": "unisex", "slug": "unisex", "nombre": "Unisex", "descripcion": "Fragancias pensadas para cualquier persona." }
  ]
}
```

**Errores:** `500` (§5.1).

### 2.3 `GET /api/v1/productos`

Catálogo con filtrado, búsqueda, ordenación y paginación. **Es el endpoint espejo de `catalogo.listarProductos(filtro)`.**

| Query | Tipo | Valores permitidos | Efecto |
|---|---|---|---|
| `categoria` | string | slug de categoría existente | filtra por `categoriaId` |
| `familia` | string | `citrico` \| `floral` \| `amaderado` \| `oriental` \| `frutal` \| `acuatico` \| `gourmand` | filtra por `Producto.familia` (chips de §2.1 de `design`; ver `docs/decisiones.md` D-DATOS-1) |
| `q` | string | 2–60 caracteres | busca en `nombre`, `marca` y las notas |
| `orden` | string | `destacados` \| `novedades` \| `nombre-asc` \| `precio-asc` \| `precio-desc` | ordena/filtra (por defecto `destacados`) |
| `pagina` | entero | ≥ 1 (por defecto `1`) | página a devolver |
| `limite` | entero | 1–48 (por defecto `12`) | tamaño de página |

Reglas: parámetros desconocidos se ignoran; `orden` o `familia` con valor no permitido → `400` `parametro_invalido`; `categoria` inexistente → `200` con `data: []` (no es un error); `q` de 1 carácter → `400` `parametro_invalido`.

**Ejemplo:** `GET /api/v1/productos?categoria=mujer&orden=precio-asc&pagina=1&limite=12`

**Response `200`**

```json
{
  "data": [
    {
      "id": "9f2c1a70-4b3e-4d6a-8f21-0c5d7e9a1b23",
      "slug": "brisa-de-coco-100",
      "marca": "Casa Palma",
      "nombre": "Brisa de Coco",
      "tamano": "100 ml",
      "tamanoMl": 100,
      "precio": 2500,
      "moneda": "CUP",
      "descripcion": "Fresca, luminosa y ligera.",
      "notas": {
        "salida": ["Bergamota", "Limón verde"],
        "corazon": ["Jazmín", "Flor de azahar"],
        "fondo": ["Coco", "Sándalo", "Almizcle blanco"]
      },
      "imagen": {
        "src": "/productos/brisa-de-coco.webp",
        "alt": "Frasco de Brisa de Coco de 100 ml sobre fondo arena"
      },
      "categoriaId": "mujer",
      "destacado": true,
      "novedad": false
    }
  ],
  "meta": { "pagina": 1, "limite": 12, "total": 8, "totalPaginas": 1 }
}
```

**Errores:** `400` (query inválido), `429` (§5.2), `500`.

### 2.4 `GET /api/v1/productos/{slug}`

Ficha de un producto. **Espejo de `catalogo.obtenerProductoPorSlug(slug)`.**

**Ejemplo:** `GET /api/v1/productos/brisa-de-coco-100`

**Response `200`** — objeto `Producto` completo (mismo JSON que un elemento de §2.3, sin `data`).

**Errores:**

| Caso | Status | Código |
|---|---|---|
| slug no existe o no está publicado | `404` | `producto_no_encontrado` |
| slug con formato inválido (mayúsculas, espacios) | `400` | `parametro_invalido` |

### 2.5 Productos relacionados

No hay endpoint propio: se resuelve con el listado, excluyendo el actual.

`GET /api/v1/productos?categoria={categoriaId}&limite=4` — el cliente descarta el producto actual (`slug` distinto). Equivale a `catalogo.listarRelacionados(slug, limite)`.

---

## 3. Carrito

> **Fuera de alcance de la Fase 2.** Se especifica aquí porque el carrito es el primer consumidor real de la API y porque su forma de datos condiciona el checkout.

Todas las peticiones de esta sección requieren cabecera `X-Carrito-Id` (§1.5). Ninguna requiere usuario autenticado.

### 3.1 `GET /api/v1/carrito`

**Response `200`**

```json
{
  "id": "8b1de5c2-7a44-4a1e-9f6b-3f0c2d5a7e11",
  "lineas": [
    {
      "lineaId": "d1c2e3f4-0000-4000-8000-000000000001",
      "productoId": "9f2c1a70-4b3e-4d6a-8f21-0c5d7e9a1b23",
      "slug": "brisa-de-coco-100",
      "marca": "Casa Palma",
      "nombre": "Brisa de Coco",
      "tamano": "100 ml",
      "precio": 2500,
      "moneda": "CUP",
      "cantidad": 2,
      "subtotal": 5000,
      "imagen": {
        "src": "/productos/brisa-de-coco.webp",
        "alt": "Frasco de Brisa de Coco de 100 ml sobre fondo arena"
      }
    }
  ],
  "resumen": {
    "subtotal": 5000,
    "envio": 0,
    "total": 5000,
    "moneda": "CUP",
    "cantidadTotal": 2
  },
  "actualizadoEn": "2026-10-24T15:30:00-05:00"
}
```

- Carrito vacío → `200` con `lineas: []` y todos los importes en `0` (no `404`).
- `envio` se calcula en servidor según reglas de envío todavía no definidas → hasta entonces `0` y un campo `"envioAplicable": false`.

**Errores:** `400` `carrito_id_invalido`, `500`.

### 3.2 `POST /api/v1/carrito/lineas`

Añadir una unidad de un producto (o incrementar si ya existe la línea de ese `productoId`).

**Request**

```json
{
  "productoId": "9f2c1a70-4b3e-4d6a-8f21-0c5d7e9a1b23",
  "cantidad": 1
}
```

**Response `201`** — carrito completo con el mismo formato de §3.1.

**Errores:**

| Status | Código | Cuándo |
|---|---|---|
| `400` | `parametro_invalido` | `cantidad` fuera de 1–10 o no entero |
| `404` | `producto_no_encontrado` | `productoId` inexistente o despublicado |
| `409` | `stock_insuficiente` | no hay existencias suficientes |
| `429` | `limite_excedido` | 20 líneas distintas o 99 unidades en el carrito |
| `500` | `error_interno` | fallo no previsto |

### 3.3 `PATCH /api/v1/carrito/lineas/{lineaId}`

Cambiar cantidad. `cantidad: 0` equivale a eliminar (o usar `DELETE`).

**Request**

```json
{ "cantidad": 3 }
```

**Response `200`** — carrito completo (§3.1).

**Errores:** `400` `parametro_invalido`, `404` `linea_no_encontrada`, `409` `stock_insuficiente`, `429` `limite_excedido`, `500`.

### 3.4 `DELETE /api/v1/carrito/lineas/{lineaId}`

**Response `200`** — carrito completo (§3.1). *No* se usa `204`, porque el cliente necesita recalcular el resumen sin una segunda petición.

**Errores:** `404` `linea_no_encontrada`, `500`.

### 3.5 `DELETE /api/v1/carrito`

Vaciar todo el carrito.

**Response `200`** — carrito vacío (§3.1 con `lineas: []`).
**Errores:** `400` `carrito_id_invalido`, `500`.

---

## 4. Pedidos

> **Fuera de alcance de la Fase 2.** Requiere las decisiones pendientes D3 (cobro), D5 (moneda) y D1 (datos) de `docs/arquitectura.md` §12. El checkout y el cobro real son Fase 4; el listado de pedidos con sesión, Fase 5.

### 4.1 `POST /api/v1/pedidos`

Crea un pedido a partir del carrito actual. Cabeceras: `X-Carrito-Id` + `Idempotency-Key` (§1.7).

**Request**

```json
{
  "cliente": {
    "nombre": "María Pérez",
    "telefono": "+5355555555",
    "email": "maria@ejemplo.cu",
    "direccion": "Calle 12 #345, entre A y B",
    "municipio": "Plaza de la Revolución",
    "provincia": "La Habana"
  },
  "metodoPago": "transferencia",
  "notas": "Llamar antes de entregar."
}
```

`metodoPago`: valor de un enum que **se decidirá en la fase de pagos**; mientras tanto el endpoint debe rechazar cualquier valor que no esté en su catálogo con `422` `metodo_pago_no_disponible`. Aquí se pone `transferencia` sólo como ejemplo de forma.

**Response `201`**

```json
{
  "id": "3a7c9d11-5b62-4c0e-a1d4-9e8f0b2c6a44",
  "numero": "PP-2026-000157",
  "estado": "pendiente",
  "creadoEn": "2026-10-24T15:30:00-05:00",
  "cliente": {
    "nombre": "María Pérez",
    "telefono": "+5355555555",
    "email": "maria@ejemplo.cu",
    "direccion": "Calle 12 #345, entre A y B",
    "municipio": "Plaza de la Revolución",
    "provincia": "La Habana"
  },
  "metodoPago": "transferencia",
  "lineas": [
    {
      "lineaId": "d1c2e3f4-0000-4000-8000-000000000001",
      "productoId": "9f2c1a70-4b3e-4d6a-8f21-0c5d7e9a1b23",
      "slug": "brisa-de-coco-100",
      "nombre": "Brisa de Coco",
      "marca": "Casa Palma",
      "tamano": "100 ml",
      "precio": 2500,
      "cantidad": 2,
      "subtotal": 5000
    }
  ],
  "resumen": {
    "subtotal": 5000,
    "envio": 0,
    "total": 5000,
    "moneda": "CUP"
  },
  "notas": "Llamar antes de entregar."
}
```

Al crearse se vacía el carrito del `X-Carrito-Id`.

**Errores:**

| Status | Código | Cuándo |
|---|---|---|
| `400` | `carrito_vacio` | no hay líneas en el carrito |
| `400` | `carrito_id_invalido` | falta o no es UUID válido |
| `400` | `idempotency_key_ausente` | no se envió `Idempotency-Key` |
| `422` | `validacion_fallida` | datos del cliente inválidos (respuesta incluye `detalles[]`) |
| `422` | `metodo_pago_no_disponible` | método de pago no soportado aún |
| `409` | `stock_insuficiente` | el stock cambió entre ver carrito y crear pedido |
| `409` | `idempotencia_conflicto` | misma clave, cuerpo distinto |
| `429` | `limite_excedido` | demasiados pedidos desde la misma identidad en poco tiempo |
| `500` | `error_interno` | fallo no previsto |

### 4.2 `GET /api/v1/pedidos`

Lista los pedidos del usuario autenticado. Cabecera `Authorization` obligatoria.

**Query:** `pagina` (≥1, por defecto 1), `limite` (1–48, por defecto 10), `estado` (opcional, un valor del enum de §4.4).

**Response `200`** — `{ "data": [ { resumen de pedido } ], "meta": { ... } }`, orden descendente por `creadoEn`.

**Errores:** `401` `no_autenticado`, `403` `sin_permiso`, `400` `parametro_invalido`, `500`.

### 4.3 `GET /api/v1/pedidos/{pedidoId}`

Detalle de un pedido. El propietario ve cualquier estado; un admin (rol futuro) ve los de todos.

**Response `200`** — objeto pedido completo (formato de §4.1) más:

```json
{
  "historial": [
    { "estado": "pendiente", "en": "2026-10-24T15:30:00-05:00" },
    { "estado": "confirmado", "en": "2026-10-24T16:05:00-05:00" }
  ]
}
```

**Errores:** `401` `no_autenticado`, `403` `sin_permiso`, `404` `pedido_no_encontrado`, `500`.

### 4.4 Estados del pedido (enum)

```text
pendiente → confirmado → en_preparacion → enviado → entregado
    ↘ cancelado   (cualquier estado previo a "enviado")
```

`pendiente`: creado, sin confirmar cobro. `confirmado`: pago verificado o pedido aceptado manualmente. El servidor es quien transmite los estados; el cliente sólo los pinta.

---

## 5. Estados de error

### 5.1 Forma única de error

Todo error (4xx y 5xx) devuelve el mismo envoltorio:

```json
{
  "error": {
    "codigo": "producto_no_encontrado",
    "mensaje": "No existe un producto con ese identificador.",
    "detalles": []
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `codigo` | string | identificador estable en `snake_case`; **el cliente rama por este campo**, no por el texto |
| `mensaje` | string | texto en español, apto para mostrar al usuario final |
| `detalles` | array | vacío salvo en `validacion_fallida`: `[{ "campo": "cliente.telefono", "problema": "debe incluir el código del área" }]` |

### 5.2 Códigos y significado

| Status | `codigo` | Significado | ¿Reintentable? |
|---|---|---|---|
| `400` | `parametro_invalido` | query, path o cuerpo con valores inválidos | no (corregir solicitud) |
| `400` | `carrito_id_invalido` | `X-Carrito-Id` ausente o no UUID | no |
| `400` | `carrito_vacio` | crear pedido sin líneas | no |
| `400` | `idempotency_key_ausente` | falta la cabecera en `POST /pedidos` | no |
| `401` | `no_autenticado` | sin token o caducado | no (refrescar sesión) |
| `403` | `sin_permiso` | token válido, sin acceso al recurso | no |
| `404` | `producto_no_encontrado` | slug/`productoId` inexistente | no |
| `404` | `linea_no_encontrada` | `lineaId` no pertenece a este carrito | no |
| `404` | `pedido_no_encontrado` | pedido inexistente o de otro usuario | no |
| `409` | `stock_insuficiente` | no hay existencias para la cantidad pedida | sí, con menos cantidad |
| `409` | `idempotencia_conflicto` | misma `Idempotency-Key` con cuerpo distinto | no |
| `409` | `carrito_desactualizado` | el carrito cambió en el servidor | sí, releyendo `GET /carrito` |
| `422` | `validacion_fallida` | errores de campos (`detalles[]`) | no |
| `422` | `metodo_pago_no_disponible` | medio de pago aún no habilitado | no |
| `429` | `limite_excedido` | rate limit o límites de carrito/pedidos | sí, tras `Retry-After` |
| `500` | `error_interno` | fallo no previsto | sí, con cuidado |
| `503` | `servicio_no_disponible` | mantenimiento o dependencia caída | sí, tras `Retry-After` |

Convención de reintento: ante `500`/`503`/`429` el cliente espera los segundos indicados en la cabecera `Retry-After` (por defecto 2 s) y reintenta **una** vez; los demás códigos no se reintentan automáticamente.

### 5.3 Manejo de errores en la interfaz

- Catálogo y ficha se renderizan en servidor: si la API falla en una futura fase, se muestra un bloque de error con botón «Reintentar» (`router.refresh()`), nunca una pantalla en blanco.
- `404` de producto → `notFound()` → `app/not-found.tsx` (comportamiento idéntico al de hoy con datos demo).
- `401` en `/cuenta` → redirect a la página de acceso conservando `?next=`.
- Errores de carrito/pedido → mensaje junto a la acción que lo originó, con `role="alert"`.

---

## 6. Cómo se llega de la Fase 2 a esta API (sin reescribir la UI)

### 6.1 Camino previsto

1. Se crean Route Handlers bajo `app/api/v1/**/route.ts` que implementan §2, §3 y §4.
2. Se añade `lib/catalogo/repositorio-api.ts` con `const catalogoApi: CatalogoRepositorio = { ... }`, donde cada método hace `fetch` a su endpoint, comprueba `res.ok`, analiza el envoltorio `{ data, meta }` o `{ error }` y **devuelve los tipos de dominio** `Producto`/`Categoria` (mapeando `ProductoApi` → `Producto`, que hoy son idénticos: §1.3).
3. En `lib/catalogo/index.ts` se elige la fuente con una única línea, según variable de entorno de servidor:

```ts
import { repositorioDemo } from "./repositorio-demo";
const fuente: CatalogoRepositorio =
  process.env.CATALOGO_FUENTE === "api" ? repositorioApi : repositorioDemo;
export const catalogo: CatalogoRepositorio = fuente;
```

4. **Ningún archivo de `app/` ni de `components/` se modifica.** Si algo hay que tocar en la UI, es un fallo de la frontera de abstracción, no un motivo para reescribir páginas.

### 6.2 Validación de la frontera

`zod` (pendiente de aprobación, `docs/arquitectura.md` §2.3) se usaría **sólo dentro de `repositorio-api.ts`** para validar la respuesta antes de convertirla a tipos de dominio. Un esquema que no coincide con §1.3 significa que la API rompió el contrato, y el error debe saltar en desarrollo en lugar de propagarse a la UI.

### 6.3 Contraste: lo que la Fase 2 hace hoy frente a lo que hará

| Situación | Fase 2 (demo, ahora) | Fase 3+ (API, después) |
|---|---|---|
| Origen | `data/productos.ts` importado en el servidor | `GET /api/v1/productos` |
| Latencia | nula (compilado) | red: mostrar `loading`/`Suspense` en la página |
| Error de red | imposible | bloque de error + reintentar (§5.3) |
| `404` de producto | `obtenerProductoPorSlug` → `null` → `notFound()` | `res.status === 404` → `notFound()` |
| Filtrado | en memoria (`aplicarFiltro`) | query params del §2.3, misma semántica |
| Cache | estática en build | decidir revalidación (`revalidate`/`tags`) al implementar |
| Ficheros tocados | ninguno | `lib/catalogo/index.ts` + 1 archivo nuevo |

### 6.4 Checklist de cumplimiento para el agente `frontend` (Fase 2)

- [ ] Ningún archivo bajo `app/api/`.
- [ ] Ningún `fetch` en `app/` ni `components/`.
- [ ] Todo acceso a datos pasa por `@/lib/catalogo`.
- [ ] El tipo usado para renderizar productos es `Producto` de `lib/catalogo/tipos.ts`, con todos los campos de §1.3.
- [ ] `ProductoFiltro` conserva los campos `categoria`, `familia`, `busqueda`, `orden` y los valores de `orden` de §2.3.
- [ ] El dinero se pinta **sólo** con `components/ui/Precio`, que usa `Intl.NumberFormat("es-CU", { style: "currency" })` y el texto «CUP» accesible aparte — nunca concatenando `$` + número (§10 de `docs/design/componentes.md` manda sobre `formatearPrecio()` de `docs/arquitectura.md`; ver `docs/decisiones.md` D-DINERO-1).
- [ ] `Producto` inexistente → `notFound()`, no una página de error.
- [ ] En la UI no aparece ninguna referencia a API, endpoints ni «próximamente»; sí el aviso de datos de demostración.
