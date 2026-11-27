import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { productos } from "../../../../db/schema";
import { eq } from "drizzle-orm";

/**
 * Sirve la imagen de un producto almacenada en Neon (columna bytea).
 * URL: /api/imagenes/<id-del-producto>
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    const [fila] = await db
      .select({
        imagenDatos: productos.imagenDatos,
        imagenTipo: productos.imagenTipo,
      })
      .from(productos)
      .where(eq(productos.id, params.id))
      .limit(1);

    if (!fila?.imagenDatos) {
      return new NextResponse("Imagen no encontrada", { status: 404 });
    }

    const buffer = Buffer.from(fila.imagenDatos);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": fila.imagenTipo || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Error interno", { status: 500 });
  }
}
