import { defineConfig, devices } from "@playwright/test";

// Carga variables de .env.local para admin E2E (sin imprimir valores)
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local, los tests de admin se saltan automáticamente
}

/**
 * Configuración de Playwright — Peache Perfumes (decisión D8 del cliente).
 *
 * - Proyecto único `chromium` (el binario ya está descargado:
 *   `chromium_headless_shell`).
 * - Puerto fijo 3000 y `baseURL` para que los specs puedan usar rutas
 *   relativas (`page.goto("/catalogo")`). Los specs existentes que usan
 *   URLs absolutas `http://localhost:3000/...` no se tocan y siguen igual.
 * - `testMatch` restringido a `*.spec.ts`: los tests unitarios de Vitest
 *   (globs `tests/unit/**` con sufijo `.test.ts`) NO son specs de Playwright y no deben
 *   ejecutarse con este runner (recíprocamente, Vitest limita su `include`
 *   a `tests/unit/**` en `vitest.config.ts`).
 * - `webServer`: `npm run build && npm run start` — artefacto de PRODUCCIÓN
 *   fresco en cada ejecución, servido por `next start` en el puerto 3000
 *   (comprobable mediante `url`). Se elige build+start (y no `next dev`)
 *   para que los E2E midan el mismo runtime que producción.
 *   `reuseExistingServer: !process.env.CI`: si ya hay un servidor escuchando
 *   en 3000 (p. ej. el `next dev` del desarrollador) se reutiliza sin
 *   compilar —evita además el conflicto de artefactos `.next` entre `dev` y
 *   `build`—; en CI (`CI=1`) nunca se reutiliza: siempre build+start fresco.
 */

const PUERTO = 3000;
const URL_BASE = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  // Borra los usuarios e2e-…@ejemplo.cu que crean los specs de identidad.
  globalTeardown: "./tests/limpieza-global.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  // Reporte de lista por consola: legible en local y en CI.
  reporter: [["list"]],
  use: {
    baseURL: URL_BASE,
    locale: "es-ES",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "**/dashboard.spec.ts",
    },
    {
      // F3-C: el CRUD del panel crea/oculta productos reales en la BD. Corre
      // DESPUÉS del resto para no alterar los conteos del catálogo que
      // comprueban los specs de la tienda mientras se ejecutan en paralelo.
      name: "panel",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/dashboard.spec.ts",
      dependencies: ["chromium"],
    },
  ],
  webServer: {
    // `npm run build && npm run start` — artefacto de producción fresco. La
    // URL del health-check es `/catalogo` (y no `/`): así Playwright espera a
    // que la ruta DINÁMICA del catálogo responda 200 —lo que fuerza el primer
    // render SSR, la creación del pool `pg` y el calentamiento de V8— ANTES de
    // lanzar los 6 workers. Diagnóstico de la regresión no determinista de
    // F3-A (28/10/2026): con el health-check en `/` (una ruta estática), el
    // primer render del catálogo se apilaba con el arranque simultáneo de los
    // 6 Chromium justo tras el build; en esa ventana la CPU del portátil
    // alcanzaba 95-99 % y las respuestas del server se inflaban (TTFB de
    // 1,5-3,4 s también en chunks estáticos), de modo que las navegaciones
    // `toHaveURL` de los specs (presupuesto 5 s) fallaban de forma aleatoria.
    // Con el health-check en `/catalogo` esas dos cargas frías quedan
    // desapiladas; los datos de la BD siguen sin fallback: si PostgreSQL está
    // caído, la ruta nunca responde 200 y el webServer agota su timeout
    // (comportamiento deseado, spec F3-A §7).
    command: "npm run build && npm run start",
    url: `${URL_BASE}/catalogo`,
    reuseExistingServer: !process.env.CI,
    // El build de producción puede tardar: margen amplio antes de dar por
    // fallido el arranque.
    timeout: 300_000,
  },
});
