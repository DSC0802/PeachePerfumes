import { defineConfig } from "drizzle-kit";

// drizzle-kit NO carga .env.local (sólo Next.js lo hace para la app):
// hay que leerlo antes de construir la configuración.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local el error claro lo lanza la comprobación de abajo.
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "Falta DATABASE_URL en .env.local: copia la cadena de conexión de PostgreSQL (spec F3-A §7).",
  );
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migraciones",
  dialect: "postgresql",
  dbCredentials: { url },
});
