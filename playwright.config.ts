import { defineConfig, devices } from "@playwright/test";

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
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    // El build de producción puede tardar: margen amplio antes de dar por
    // fallido el arranque.
    timeout: 300_000,
  },
});
