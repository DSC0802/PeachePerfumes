import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Pool perezoso PROPIO de identidad (mismo patrón que
// lib/catalogo/repositorio-postgres.ts): el catálogo y la identidad
// NO comparten pool para que un cuello de botella de uno no apague al otro.
let pool: Pool | null = null;

export function obtenerBase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL en .env.local: la tienda no puede verificar la identidad (spec F3-B §5).",
    );
  }
  pool ??= new Pool({ connectionString: url, max: 5 });
  return drizzle(pool); // el tipo se infiere: `drizzle` está sobrecargado
}