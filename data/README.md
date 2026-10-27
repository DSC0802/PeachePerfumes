# `data/` — catálogo de demostración (Fase 2)

> ⚠️ **Todo lo que hay en esta carpeta es FICTICIO.** Está aquí para que la
> interfaz de la Fase 2 tenga algo que mostrar, y nada más.

## Qué hay

| Archivo | Contenido |
|---|---|
| `productos.ts` | 14 perfumes de invención propia: marcas, nombres, descripciones, notas olfativas, familia olfativa, tamaños, precios y banderas `destacado` / `novedad`. |
| `categorias.ts` | 3 categorías de demostración: `mujer`, `hombre`, `unisex`. |

## Por qué es demostrativo

- **Marcas inventadas** (Casa Palma, Villa Coral, Orquídea Negra, Jazmín y Cobre,
  Taller Mangle). No corresponde a ningún fabricante real: usar marcas reales de
  perfumería es un riesgo de marca ya identificado en `docs/arquitectura.md` §6.
- **Precios de demostración en CUP**, sin relación con ningún precio real. La
  moneda y la política de precios reales son una decisión pendiente
  (`docs/arquitectura.md` §12, D5): no mostrar estos importes como definitivos.
- **Disponibilidad, banderas y taxonomía inventadas**: los estados
  `destacado`/`novedad` y las categorías se han elegido para que la landing y los
  filtros del catálogo se puedan diseñar, no porque reflejen inventario real.
- **Las imágenes no existen.** `imagen.src` apunta a `/productos/<slug>.webp`
  (rutas locales previstas en `public/productos/`); los archivos no se han
  generado y la interfaz debe mostrar un placeholder neutral. No son URLs
  remotas y no hay que descargar nada.
- La interfaz mostrará un aviso visible de «Productos de demostración»
  (`docs/arquitectura.md` §6, R3).

## Cómo se sustituirá por la API real

La carpeta `data/` **no se consume desde la UI**: sólo
`lib/catalogo/repositorio-demo.ts` la importa. La frontera de abstracción
(`docs/arquitectura.md` §6.4) garantiza que sustituirla no toque ni una página
ni un componente:

1. Se implementa la API real según `docs/api-contracto.md` (Route Handlers bajo
   `app/api/v1/**/route.ts`), con la misma forma de `Producto` y `Categoria`.
2. Se crea `lib/catalogo/repositorio-api.ts` implementando la **misma**
   interfaz `CatalogoRepositorio`, con `fetch` a esos endpoints.
3. En `lib/catalogo/index.ts` se cambia la fuente (una línea, por variable de
   entorno): `CATALOGO_FUENTE === "api" ? repositorioApi : repositorioDemo`.
4. Se reemplazan estos datos por los reales (o se dejan de poblar) y se retira
   el aviso de demostración de la UI.

Mientras tanto: **no hay backend, ni base de datos, ni endpoints**; nada de lo
de este directorio debe llegar a producción como si fueran datos reales.

## Reglas al editar estos archivos

- `slug` en minúsculas, sin acentos ni espacios (guiones como separador), único.
- `categoriaId` debe existir en `categorias.ts`.
- `familia` debe ser un valor de `FamiliaOlfativa` (`citrico`, `floral`,
  `amaderado`, `oriental`, `frutal`, `acuatico`, `gourmand`) y ser coherente con
  las notas y la descripción del producto — es lo que filtra `?familia=` en el
  catálogo (decisiones D-DATOS-1).
- `id` estable y único (`p001`…); cambiarlo afecta a cualquier enlace futuro.
- Descripciones y notas en español, sobrias, 1–3 frases por descripción.
