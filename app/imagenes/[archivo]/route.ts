import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  directorioImagenes,
  PATRON_ARCHIVO_IMAGEN,
  TIPOS_CONTENIDO,
  type ExtensionImagen,
} from "@/lib/admin/imagenes";

/**
 * GET /imagenes/<uuid>.<ext> — sirve las fotos subidas desde el panel (F3-C).
 * El nombre se valida con un patrón estricto (uuid + extensión permitida):
 * no hay forma de salir del directorio de imágenes.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ archivo: string }> },
): Promise<Response> {
  const { archivo } = await params;
  if (!PATRON_ARCHIVO_IMAGEN.test(archivo)) {
    return new Response("No encontrado", { status: 404 });
  }
  const extension = archivo.split(".").pop() as ExtensionImagen;
  try {
    const bytes = await readFile(path.join(directorioImagenes(), archivo));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TIPOS_CONTENIDO[extension],
        // El nombre es único por subida: el contenido nunca cambia.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
