import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Configuración de Vitest — suites de Node sin DOM (decisión D8).
//
// (Comentario de línea, no JSDoc: el glob `tests/**/*.test.ts` contiene la
// secuencia `*/`, que cerraría prematuramente un comentario `/** … */`.)
//
// - `include`: `tests/**/*.test.ts` — unit (`tests/unit/`) + espejo Postgres
//   (`tests/integracion/`, F3-A §8). Los specs de Playwright son `.spec.ts`
//   y quedan fuera: sólo corren bajo su runner.
// - `test.env.FUENTE_CATALOGO=demo`: la suite unit SIEMPRE prueba el
//   repositorio demo, aunque exista `.env.local` con `postgres`. La suite
//   espejo importa `repositorioPostgres` directamente y no depende de esto.
// - Alias `@/*` idéntico al de `tsconfig.json`, para que los tests consuman
//   la app igual que la UI.
// - Entorno `node`: los tests son puros (sin DOM).
const raiz = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": raiz,
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    env: {
      FUENTE_CATALOGO: "demo",
    },
  },
});
