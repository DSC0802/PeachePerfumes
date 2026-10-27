import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Fase 2 — Peache Perfumes
// Flat config (ESLint 9). `eslint-config-next` declara peer `eslint >= 9`, pero sus
// plugins embebidos (eslint-plugin-import / jsx-a11y / react) exigen `^8 || ^9`,
// por lo que el proyecto se fija en ESLint 9.x y no en 10.x.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.config.ts",
  ]),

  // Regla de arquitectura (docs/arquitectura.md §6): la UI sólo puede leer el
  // catálogo a través de `@/lib/catalogo`. `data/**` es exclusivo del repositorio
  // en demo, para que sustituirlo por una API real no exija tocar componentes.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/data/*", "../data/*", "../../data/*"],
              message:
                "La UI sólo importa desde '@/lib/catalogo' (frontera de abstracción, docs/arquitectura.md).",
            },
          ],
        },
      ],
    },
  },
]);
