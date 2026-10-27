import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configuración de Vitest — tests unitarios puros (decisión D8).
 *
 * - `include` limitado a `tests/unit/**` con sufijo `.test.ts`: los specs de
 *   Playwright (`tests/*.spec.ts`) importan `@playwright/test` y sólo tienen
 *   bajo su runner; sin este límite, `vitest run` intentaría ejecutarlos.
 * - Alias `@/*` a la raíz del proyecto, idéntico al de `tsconfig.json`
 *   (`"@/*": ["./*"]`), para que los tests consuman la app igual que la UI:
 *   `import { catalogo } from "@/lib/catalogo"`.
 * - Entorno `node`: los tests son puros (sin DOM).
 */
const raiz = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": raiz,
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
