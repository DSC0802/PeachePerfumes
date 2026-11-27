/**
 * Imágenes de producto en carpeta LOCAL (F3-C, D-F3C-IMAGENES).
 * - Se guardan fuera de `public/` (Next sólo sirve lo que existía al hacer build)
 *   y las sirve `app/imagenes/[archivo]/route.ts`.
 * - El tipo se decide por los *magic bytes*, nunca por el MIME del navegador.
 * Las funciones puras (detección, nombre) se testean sin disco.
 */
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const TAMANO_MAXIMO_IMAGEN = 4 * 1024 * 1024; // 4 MB
export const PREFIJO_URL_IMAGEN = "/imagenes/";

export type ExtensionImagen = "jpg" | "png" | "webp";

export const TIPOS_CONTENIDO: Record<ExtensionImagen, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Nombre aceptado por la ruta pública: uuid v4 + extensión permitida. */
export const PATRON_ARCHIVO_IMAGEN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

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

export function nombreArchivoImagen(extension: ExtensionImagen, id: string = randomUUID()): string {
  return `${id}.${extension}`;
}

/** `/imagenes/<archivo>` → `<archivo>` si es nuestro; null para imágenes ajenas (demo). */
export function archivoDesdeUrl(src: string): string | null {
  if (!src.startsWith(PREFIJO_URL_IMAGEN)) return null;
  const archivo = src.slice(PREFIJO_URL_IMAGEN.length);
  return PATRON_ARCHIVO_IMAGEN.test(archivo) ? archivo : null;
}

export function directorioImagenes(): string {
  return path.resolve(
    process.env.DIR_IMAGENES ?? path.join(/*turbopackIgnore: true*/ "almacen", "imagenes"),
  );
}

export type ResultadoImagen =
  | { ok: true; src: string }
  | { ok: false; error: string };

/** Valida y guarda un `File` del formulario. Devuelve la URL pública. */
export async function guardarImagen(archivo: File): Promise<ResultadoImagen> {
  if (archivo.size === 0) return { ok: false, error: "El archivo está vacío." };
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return { ok: false, error: "La imagen supera 4 MB. Redúcela y vuelve a intentarlo." };
  }
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const extension = detectarTipoImagen(bytes);
  if (!extension) {
    return { ok: false, error: "Formato no admitido. Usa JPG, PNG o WebP." };
  }
  const nombre = nombreArchivoImagen(extension);
  const directorio = directorioImagenes();
  await mkdir(directorio, { recursive: true });
  await writeFile(path.join(directorio, nombre), bytes);
  return { ok: true, src: `${PREFIJO_URL_IMAGEN}${nombre}` };
}

/** Borra una imagen propia (ignora las de demo y las que ya no existen). */
export async function borrarImagen(src: string): Promise<void> {
  const archivo = archivoDesdeUrl(src);
  if (!archivo) return;
  await unlink(
    path.join(/*turbopackIgnore: true*/ directorioImagenes(), archivo),
  ).catch(() => {});
}
