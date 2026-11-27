/**
 * Imágenes de producto almacenadas en Neon (bytea) — F3-C, D-F3C-IMAGENES.
 * - Las imágenes se guardan como datos binarios en la columna `imagen_datos`
 *   de la tabla `productos`, asociadas al `id` del producto.
 * - Se sirven mediante la ruta API `app/api/imagenes/[id]/route.ts`.
 * - En Vercel (serverless) el filesystem es solo lectura, por eso no usamos
 *   `node:fs/promises`; todo vive en PostgreSQL.
 */
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { productos as tablaProductos } from "../../db/schema";

export const TAMANO_MAXIMO_IMAGEN = 4 * 1024 * 1024; // 4 MB

export type ExtensionImagen = "jpg" | "png" | "webp";

export const TIPOS_CONTENIDO: Record<ExtensionImagen, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** UUID válido usado como identificador de imagen (y de producto). */
export const PATRON_ID_IMAGEN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Devuelve la extensión real según la cabecera binaria, o null si no es imagen válida. */
export function detectarTipoImagen(bytes: Uint8Array): ExtensionImagen | null {
  const empieza = (firma: number[], desde = 0) =>
    bytes.length >= desde + firma.length && firma.every((b, i) => bytes[desde + i] === b);

  if (empieza([0xff, 0xd8, 0xff])) return "jpg";
  if (empieza([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // RIFF....WEBP
  if (empieza([0x52, 0x49, 0x46, 0x46]) && empieza([0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

/** `/imagenes/<id>` → devuelve el id si es un UUID válido; null para URLs ajenas. */
export function archivoDesdeUrl(src: string): string | null {
  if (!src.startsWith("/api/imagenes/")) return null;
  const id = src.slice("/imagenes/".length);
  return PATRON_ID_IMAGEN.test(id) ? id : null;
}

export type ResultadoImagen =
  | { ok: true; src: string }
  | { ok: false; error: string };

/**
 * Guarda la imagen en Neon (columna `imagen_datos` de `productos`) y devuelve
 * la URL para servirla vía `/api/imagenes/<productoId>`.
 * `productoId` es el UUID del producto al que pertenece la imagen.
 */
export async function guardarImagen(
  archivo: File,
  productoId: string
): Promise<ResultadoImagen> {
  if (!PATRON_ID_IMAGEN.test(productoId)) {
    return { ok: false, error: "ID de producto inválido." };
  }
  if (archivo.size === 0) return { ok: false, error: "El archivo está vacío." };
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return { ok: false, error: "La imagen supera 4 MB. Redúcela y vuelve a intentarlo." };
  }

  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const extension = detectarTipoImagen(bytes);
  if (!extension) {
    return { ok: false, error: "Formato no admitido. Usa JPG, PNG o WebP." };
  }

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  await db
    .update(tablaProductos)
    .set({
      imagenDatos: bytes,
      imagenTipo: TIPOS_CONTENIDO[extension],
    })
    .where(eq(tablaProductos.id, productoId));

  return { ok: true, src: `/api/imagenes/${productoId}` };
}

/** Borra la imagen de un producto (pone imagen_datos e imagen_tipo en null). */
export async function borrarImagen(src: string): Promise<void> {
  const id = archivoDesdeUrl(src);
  if (!id) return;
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  await db
    .update(tablaProductos)
    .set({ imagenDatos: null, imagenTipo: null })
    .where(eq(tablaProductos.id, id));
}
