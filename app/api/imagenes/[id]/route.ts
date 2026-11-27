import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/**
 * Sirve la imagen de un producto almacenada en Neon (columna bytea).
 * URL: /api/imagenes/<id-del-producto>
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = neon(process.env.DATABASE_URL!);

    const resultado = await sql`
      SELECT imagen_datos, imagen_tipo
      FROM productos
      WHERE id = ${id}
      LIMIT 1
    `;

    const fila = resultado[0];
    if (!fila?.imagen_datos) {
      return new NextResponse("Imagen no encontrada", { status: 404 });
    }

    const buffer = Buffer.from(fila.imagen_datos);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": fila.imagen_tipo || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Error interno", { status: 500 });
  }
}
