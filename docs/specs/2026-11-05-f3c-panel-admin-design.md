# F3-C (parcial) · Panel de administración — Diseño

**Fecha:** 05/11/2026 · **Estado:** implementado · **HUs:** 20, 21, 22, 23, 24, 25 + reportes de catálogo, inventario y clientes.
**Plan:** decisiones acordadas con el cliente el 05/11/2026 (ver `docs/decisiones.md` § F3-C).

## 1 · Objetivo
Convertir `/dashboard` en un panel profesional con tablas y reportes reales, y permitir **crear, editar y quitar** productos **con foto**.

## 2 · Decisiones del cliente (no re-litigar)
| # | Decisión |
|---|---|
| 1 | Los componentes de `components/dashboard/` (hechos con Tailwind y datos falsos) se **adaptan** a CSS modules + tokens + datos reales; no se borran. |
| 2 | Imágenes en **carpeta local** fuera de `public/` (`almacen/imagenes/`, gitignored, configurable con `DIR_IMAGENES`), servidas por `app/imagenes/[archivo]/route.ts`. |
| 3 | **Stock** en BD: migración `0002` (`productos.stock integer NOT NULL DEFAULT 0` + `CHECK (stock >= 0)`). |
| 4 | Reportes de **catálogo, inventario y clientes**. Sin pedidos no hay ventas: los bloques de ventas muestran «Disponible con pedidos (F3-D)». Ninguna cifra inventada. |
| 5 | «Quitar» = **ocultar/restaurar** (HU-23, sin borrado físico). |

## 3 · Rutas (todas bajo el matcher del proxy + `requerirAdmin()` en `app/dashboard/layout.tsx`)
| Ruta | Contenido |
|---|---|
| `/dashboard` | 4 KPI (productos en catálogo, valor del inventario, stock bajo, clientes), productos por categoría, top 5 por valor de inventario, tabla de stock bajo, bloque de ventas vacío, accesos rápidos. |
| `/dashboard/productos` | Tabla con miniatura, categoría, precio, stock, estado (cambio en línea), visibilidad; filtros por URL (`q`, `estado`, `ocultos=1`); acciones Editar · Quitar (con confirmación) · Restaurar. |
| `/dashboard/productos/nuevo` · `/[id]/editar` | `FormularioProducto` (`useActionState`): datos, precio/tamaño/stock, clasificación, notas, foto con vista previa y texto alternativo. |
| `/dashboard/reportes` | Familia, rango de precio, valor por categoría, estados, altas de clientes por semana (8 semanas), tabla de inventario por categoría y exportación CSV. |
| `/dashboard/reportes/csv` | Inventario completo (incluye ocultos), `;` como separador, BOM UTF-8 y protección anti-fórmulas. |
| `/dashboard/clientes` | Cuentas registradas (sin `password_hash`, nunca). |
| `/imagenes/[archivo]` | Fotos subidas; nombre `uuid.ext` validado con regex (sin path traversal), `immutable`. |

## 4 · Seguridad
- **Cada server action** de `lib/admin/acciones.ts` empieza con `requerirAdmin()`: el proxy no cubre las acciones (son POST a cualquier ruta).
- Tipo de imagen por **magic bytes** (JPEG/PNG/WebP; SVG rechazado), 4 MB máx. (`serverActions.bodySizeLimit = 5mb`).
- `?volver=` de las acciones sólo acepta rutas `/dashboard…`.

## 5 · Límites conocidos
- HU-26/27 (catálogo público sólo `activo`; `agotado` sin «Añadir») → siguiente bloque. Hoy la tienda sólo excluye los **ocultos**.
- Tasa USD/CUP (HU-50…53) → siguiente bloque de F3-C.
- Un producto oculto muestra el «No encontramos este perfume» con **soft-404** (200 + `noindex`): `app/producto/[slug]/loading.tsx` empieza el streaming antes del `notFound()` (docs Next 16 `loading.md` §Status codes).
- La exportación es CSV; sin PDF.

## 6 · Pruebas
Unit (`tests/unit/admin.test.ts`, 16) · integración Postgres (`tests/integracion/admin-postgres.test.ts`, 5) · E2E (`tests/dashboard.spec.ts`, proyecto Playwright `panel` que corre **después** del resto para no alterar los conteos del catálogo) · axe en las 5 vistas del panel en tema claro y oscuro.
