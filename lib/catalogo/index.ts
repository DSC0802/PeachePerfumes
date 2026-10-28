import type { CatalogoRepositorio } from "./repositorio";
import { repositorioDemo } from "./repositorio-demo";
import { repositorioPostgres } from "./repositorio-postgres";

export * from "./tipos";
export type { CatalogoRepositorio };

/**
 * ÚNICO punto de entrada de `app/` y `components/` hacia los datos del catálogo
 * (docs/arquitectura.md §6). F3-A: conmutador demo ⇄ PostgreSQL (spec §6).
 * - `FUENTE_CATALOGO=postgres` → BD local (`.env.local`).
 * - Cualquier otro valor, incluido ausente → demo: quien no configura nada
 *   sigue funcionando como hoy (CI, revisores). Sin fallback en runtime:
 *   si la BD falla, el repositorio lanza y la ruta muestra su error.tsx (§7).
 */
const fuente = process.env.FUENTE_CATALOGO;
export const catalogo: CatalogoRepositorio =
  fuente === "postgres" ? repositorioPostgres : repositorioDemo;
