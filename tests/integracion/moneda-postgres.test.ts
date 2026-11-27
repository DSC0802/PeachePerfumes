import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { repositorioPostgres } from "@/lib/catalogo/repositorio-postgres";
import { guardarTasa, historialTasas, obtenerTasaVigente } from "@/lib/moneda/repositorio";

/**
 * Integración F3-C2 contra PostgreSQL real: tasas de cambio y disponibilidad.
 * - Las tasas de prueba se borran al terminar (la vigente vuelve a ser la real).
 * - El producto de prueba de stock es uno de la semilla: se pone a 0 y se
 *   restaura en un `finally`. Sigue visible (agotado se ve), así que la suite
 *   espejo que corre en paralelo no cambia sus recuentos.
 */

try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
    process.stderr.write(`\n⚠ .env.local ilegible: ${(error as Error).message}\n`);
  }
}

let disponible = false;
if (process.env.DATABASE_URL) {
  const sondeo = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
  try {
    await sondeo.query("SELECT 1 FROM tasas_cambio LIMIT 1");
    disponible = true;
  } catch (error) {
    process.stderr.write(`\n⚠ Suite moneda Postgres OMITIDA — ${(error as Error).message}\n`);
  } finally {
    await sondeo.end();
  }
} else {
  process.stderr.write("\n⚠ Suite moneda Postgres OMITIDA — falta DATABASE_URL en .env.local\n");
}

const tasasCreadas: string[] = [];

afterAll(async () => {
  if (!disponible || tasasCreadas.length === 0) return;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("DELETE FROM tasas_cambio WHERE id = ANY($1::uuid[])", [tasasCreadas]);
  await pool.end();
});

describe.skipIf(!disponible)("moneda y disponibilidad (PostgreSQL)", () => {
  it("la tasa vigente es la última registrada y el historial nombra al autor", async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const { rows } = await pool.query<{ id: string; email: string }>(
      "SELECT id, email FROM usuarios WHERE rol = 'admin' LIMIT 1",
    );
    await pool.end();
    expect(rows.length).toBe(1);

    await guardarTasa(111.11, rows[0].id);
    await new Promise((r) => setTimeout(r, 15));
    await guardarTasa(222.22, rows[0].id);

    const vigente = await obtenerTasaVigente();
    expect(vigente?.cupPorUsd).toBe(222.22);

    const historial = await historialTasas(2);
    expect(historial.map((t) => t.cupPorUsd)).toEqual([222.22, 111.11]);
    expect(historial[0].autor).toBe(rows[0].email);
    tasasCreadas.push(...historial.map((t) => t.id));
  });

  it("la BD rechaza una tasa no positiva", async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await expect(pool.query("INSERT INTO tasas_cambio (cup_por_usd) VALUES (0)")).rejects.toThrow(
      /tasas_cambio_positiva/,
    );
    await pool.end();
  });

  it("un producto activo sin stock se ve en la tienda como no disponible", async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const { rows } = await pool.query<{ slug: string; stock: number }>(
      "SELECT slug, stock FROM productos WHERE NOT oculto AND estado = 'activo' AND stock > 0 ORDER BY slug LIMIT 1",
    );
    const { slug, stock } = rows[0];
    try {
      expect((await repositorioPostgres.obtenerProductoPorSlug(slug))?.disponible).toBe(true);
      await pool.query("UPDATE productos SET stock = 0 WHERE slug = $1", [slug]);
      const agotado = await repositorioPostgres.obtenerProductoPorSlug(slug);
      expect(agotado).not.toBeNull();
      expect(agotado?.disponible).toBe(false);
    } finally {
      await pool.query("UPDATE productos SET stock = $2 WHERE slug = $1", [slug, stock]);
      await pool.end();
    }
  });
});
