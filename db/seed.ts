/**
 * SEMILLA de fábrica (HU-61, spec F3-A §4).
 *
 * Idempotente: re-ejecutarla restaura categorías y productos a los datos de
 * `data/` dentro de una transacción (borra y re-inserta; no duplica nada).
 * Uso: `npm run db:seed` — requiere `.env.local` con DATABASE_URL y la BD creada.
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { categorias } from "../data/categorias";
import { productos } from "../data/productos";
import { categorias as tablaCategorias, productos as tablaProductos } from "./schema";

async function sembrar(): Promise<void> {
  // Los `import` de arriba no leen el entorno; `.env.local` se carga aquí,
  // antes de tocar DATABASE_URL (Next.js lo carga solo para la app, no para tsx).
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Sin .env.local: el error claro lo lanza la comprobación de abajo.
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

    await db.transaction(async (transaccion) => {
      // Orden de borrado por la FK productos → categorias.
      await transaccion.delete(tablaProductos);
      await transaccion.delete(tablaCategorias);

      await transaccion.insert(tablaCategorias).values(
        categorias.map((categoria) => ({
          id: categoria.id,
          slug: categoria.slug,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
        })),
      );

      await transaccion.insert(tablaProductos).values(
        productos.map((producto) => ({
          slug: producto.slug,
          marca: producto.marca,
          nombre: producto.nombre,
          tamano: producto.tamano,
          tamanoMl: producto.tamanoMl,
          // numeric(10,2): el driver espera string.
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
        })),
      );
      // estado y oculto toman sus defaults: 'activo' y false (spec §4).
    });

    const [totalProductos] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tablaProductos);
    const [totalCategorias] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tablaCategorias);

    console.log(
      `✓ Semilla aplicada: ${totalProductos.n} productos y ${totalCategorias.n} categorías.`,
    );
  } finally {
    await pool.end();
  }
}

sembrar().catch((error: unknown) => {
  console.error("✗ Falló la semilla:", error);
  process.exitCode = 1;
});
