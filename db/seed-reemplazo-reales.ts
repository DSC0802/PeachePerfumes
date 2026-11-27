/**
 * REEMPLAZO de catálogo — borra todos los productos existentes e inserta
 * los 16 perfumes reales de `data/productos.ts`.
 *
 * DESTRUCTIVO: elimina cualquier producto previo (demo o creado desde admin).
 * Usar solo cuando se quiera restablecer el catálogo desde cero.
 *
 * Uso: `npx tsx db/seed-reemplazo-reales.ts`
 * Requiere: .env.local con DATABASE_URL y BD PostgreSQL creada.
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { productos } from "../data/productos";
import { productos as tablaProductos } from "./schema";

async function reemplazar(): Promise<void> {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Sin .env.local el error claro lo lanza la comprobación de abajo.
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL en .env.local: configura la cadena de conexión de PostgreSQL.",
    );
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const db = drizzle(pool);

    await db.transaction(async (tx) => {
      // 1. Borrar todos los productos existentes (demo o admin).
      await tx.delete(tablaProductos);

      // 2. Insertar los 16 productos reales.
      await tx.insert(tablaProductos).values(
        productos.map((producto) => ({
          // id se genera automáticamente con defaultRandom() en PostgreSQL
          slug: producto.slug,
          marca: producto.marca,
          nombre: producto.nombre,
          tamano: producto.tamano,
          tamanoMl: producto.tamanoMl,
          precioUsd: String(producto.precio),
          descripcion: producto.descripcion,
          notasSalida: producto.notas.salida,
          notasCorazon: producto.notas.corazon,
          notasFondo: producto.notas.fondo,
          imagenSrc: producto.imagen.src,
          imagenAlt: producto.imagen.alt,
          categoriaId: producto.categoriaId,
          familia: producto.familia,
          destacado: producto.destacado,
          novedad: producto.novedad,
          stock: producto.precio > 0 ? 1 : 0, // placeholder: stock real se fija desde el admin
          estado: "activo",
          oculto: false,
        })),
      );
    });

    const [total] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tablaProductos);

    console.log(
      `✓ Catálogo reemplazado: ${total.n} productos reales cargados en la BD.`,
    );
    console.log("  Las imágenes (placeholder) se suben desde el dashboard admin.");
  } finally {
    await pool.end();
  }
}

reemplazar().catch((error: unknown) => {
  console.error("✗ Falló el reemplazo del catálogo:", error);
  process.exitCode = 1;
});
