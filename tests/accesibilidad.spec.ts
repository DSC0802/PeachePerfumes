import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * Auditoría de accesibilidad con axe-core (decisión D8 del cliente).
 *
 * Qué se audita: `/`, `/catalogo`, `/carrito`, `/producto/brisa-de-coco-100`
 * y una ruta 404, en LOS DOS modos de tema (`data-theme="light"` y
 * `"dark"`), porque el contraste se verificó en ambos y axe calcula el
 * contraste real del DOM renderizado.
 *
 * Cómo se fija el tema: se escribe `peache-theme` en `localStorage` ANTES
 * de que corra el script anti-FOUC de `app/layout.tsx`, de modo que el
 * atributo `data-theme` del `<html>` se pinta con el tema deseado desde el
 * primer render (sin parpadeo ni pasos intermedios del conmutador).
 *
 * POLÍTICA DE FALLO (no silenciosa):
 * - BLOQUEAN el test (falla) las violaciones con impacto `critical` y
 *   `serious`, y también cualquier impacto desconocido/`null` (criterio
 *   conservador: si axe no clasifica, no se ignora).
 * - se IGNORAN los impactos `moderate` y `minor`: son hallazgos de baja
 *   severidad (p. ej. `region` —contenido fuera de un landmark—,
 *   `meta-viewport`, orden de encabezados) que no impiden navegar ni
 *   operar con teclado/lector de pantalla; el acuerdo de D8 es que sólo
 *   bloqueen los críticos/serious. NUNCA se descartan en silencio: se
 *   listan por consola con `console.warn` para que queden en el log del
 *   pipeline y puedan corregirse sin bloquear la entrega.
 * - No se desactiva ninguna regla de axe (`disableRules` vacío): el filtro
 *   es únicamente por impacto.
 *
 * Etiquetas WCAG 2.0/2.1 nivel A y AA: el alcance mínimo razonable para
 * una tienda pública. No se añaden reglas "best-practice" para no diluir
 * el señal de WCAG.
 */

const ETIQUETAS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface RutaAuditable {
  /** Ruta relativa (usa el `baseURL` de la config). */
  ruta: string;
  /** Estado HTTP esperado del `page.goto`. */
  estado: number;
}

const RUTAS: RutaAuditable[] = [
  { ruta: "/", estado: 200 },
  { ruta: "/catalogo", estado: 200 },
  { ruta: "/carrito", estado: 200 },
  { ruta: "/producto/brisa-de-coco-100", estado: 200 },
  { ruta: "/ruta-que-no-existe", estado: 404 },
];

/** ¿La violación debe romper el test? Sólo `moderate`/`minor` no bloquean. */
function esBloqueante(impacto: string | null | undefined): boolean {
  return impacto !== "moderate" && impacto !== "minor";
}

for (const tema of ["light", "dark"] as const) {
  test.describe(`Accesibilidad (axe-core) — tema ${tema}`, () => {
    for (const { ruta, estado } of RUTAS) {
      test(`${ruta} sin violaciones critical/serious (${tema})`, async ({ page }) => {
        // Fijar el tema antes de que se ejecute el script anti-FOUC.
        await page.addInitScript((valor: string) => {
          window.localStorage.setItem("peache-theme", valor);
        }, tema);

        const respuesta = await page.goto(ruta);
        expect(respuesta, `GET ${ruta} no respondió`).not.toBeNull();
        expect(respuesta!.status(), `estado HTTP de ${ruta}`).toBe(estado);

        // El tema pedido es el que realmente se aplica en el DOM.
        await expect(page.locator("html")).toHaveAttribute("data-theme", tema);

        const resultado = await new AxeBuilder({ page })
          .withTags(ETIQUETAS_WCAG)
          .analyze();

        const bloqueantes = resultado.violations.filter((v) =>
          esBloqueante(v.impact),
        );
        const ignoradas = resultado.violations.filter(
          (v) => !esBloqueante(v.impact),
        );

        // Los ignorados NO son silenciosos: quedan en la consola del runner.
        if (ignoradas.length > 0) {
          console.warn(
            `[axe] ${ruta} (${tema}) — ${ignoradas.length} violación(es) ` +
              `moderate/minor NO bloqueante(s):\n` +
              ignoradas
                .map(
                  (v) =>
                    `  - [${v.impact}] ${v.id}: ${v.help} ` +
                    `(${v.nodes.length} nodo(s))`,
                )
                .join("\n"),
          );
        }

        const resumen =
          bloqueantes.length === 0
            ? ""
            : `\nViolaciones bloqueantes en ${ruta} (tema ${tema}):\n` +
              bloqueantes
                .map(
                  (v) =>
                    `  - [${v.impact}] ${v.id}: ${v.help}\n` +
                    v.nodes
                      .map((n) => `      ${n.html}`)
                      .join("\n"),
                )
                .join("\n");

        expect(bloqueantes, resumen).toEqual([]);
      });
    }
  });
}
