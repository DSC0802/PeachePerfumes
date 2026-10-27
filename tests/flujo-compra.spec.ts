import { test, expect, type Page } from "@playwright/test";

/**
 * E2E de regresión del flujo de compra con datos de DEMOSTRACIÓN
 * (decisión D8). Sin pagos reales: el CTA «Proceder al pago» es
 * intencionadamente deshabilitado y se comprueba su microcopy literal.
 *
 * Cubre: landing → catálogo → filtro `?familia=floral` → búsqueda sin
 * resultados → orden por precio → ficha → añadir al carrito → contador de
 * cabecera → carrito (cabecera) → cantidad → vaciar → estado vacío → CTA
 * deshabilitado → modo oscuro.
 *
 * El estado del carrito vive en `localStorage` (`peache-carrito`): cada test
 * de Playwright usa contexto limpio, así que no hay fugas entre tests.
 */

/** Enlaces-tarjeta del catálogo dentro de `<main>`. */
function tarjetas(page: Page) {
  return page.locator('main a[href^="/producto/"]');
}

test.describe("Flujo de compra (datos de demostración)", () => {
  test("la landing navega al catálogo desde su CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // CTA del hero (en <main>: el estado vacío de novedades también tiene
    // un «Ver el catálogo», pero sólo se pinta si no hay novedades).
    await page
      .locator("main")
      .getByRole("link", { name: "Ver el catálogo", exact: true })
      .click();

    await expect(page).toHaveURL("/catalogo");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("el chip «Floral» aplica ?familia=floral con 4 resultados", async ({
    page,
  }) => {
    await page.goto("/catalogo");

    const chipFloral = page.getByRole("button", {
      name: "Floral",
      exact: true,
    });
    await chipFloral.click();

    await expect(page).toHaveURL("/catalogo?familia=floral");
    await expect(chipFloral).toHaveAttribute("aria-pressed", "true");
    // Conteo del catálogo (barra aria-live): 4 productos de familia floral.
    await expect(page.getByText("4 perfumes", { exact: true })).toBeVisible();
    await expect(tarjetas(page)).toHaveCount(4);
  });

  test("una búsqueda sin resultados muestra el estado vacío con microcopy", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const campo = page.getByLabel("Buscar", { exact: true });

    // 1 carácter: error de validación junto al campo, sin tocar la URL.
    await campo.fill("z");
    await expect(
      page.getByText("Escribe al menos 2 letras para buscar.", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL("/catalogo");

    // Búsqueda sin coincidencias: debounce de 300 ms y estado vacío.
    await campo.fill("zzzznoexiste");
    await expect(page).toHaveURL(/q=zzzznoexiste/);
    await expect(
      page.getByText("No encontramos perfumes para «zzzznoexiste».", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText("0 perfumes", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Limpiar búsqueda", exact: true }),
    ).toBeVisible();

    // Recuperación: limpiar devuelve al listado completo.
    await page
      .getByRole("button", { name: "Limpiar búsqueda", exact: true })
      .click();
    await expect(page).toHaveURL("/catalogo");
    expect(await tarjetas(page).count()).toBeGreaterThan(0);
  });

  test("el selector «Ordenar» orderna por precio y la URL lo refleja", async ({
    page,
  }) => {
    await page.goto("/catalogo");

    // Por defecto (sin ?orden=) el catálogo ordena por nombre A→Z.
    await expect(tarjetas(page).first()).toHaveAttribute(
      "href",
      "/producto/alba",
    );

    const ordenar = page.getByLabel("Ordenar", { exact: true });

    // Precio: menor a mayor → primer el más barato, último el más caro.
    await ordenar.selectOption("precio-asc");
    await expect(page).toHaveURL("/catalogo?orden=precio-asc");
    await expect(tarjetas(page).first()).toHaveAttribute(
      "href",
      "/producto/rosa-de-batey",
    );
    await expect(tarjetas(page).last()).toHaveAttribute(
      "href",
      "/producto/ebano",
    );

    // Los precios numéricos (<data value>) no deben decrecer.
    const preciosAsc = await page
      .locator('main a[href^="/producto/"] data')
      .evaluateAll((els) =>
        els.map((el) => Number(el.getAttribute("value"))),
      );
    expect(
      preciosAsc.every((v, i) => i === 0 || preciosAsc[i - 1] <= v),
      `precios no ascendentes: ${preciosAsc.join(", ")}`,
    ).toBe(true);

    // Precio: mayor a menor → se invierte el extremo.
    await ordenar.selectOption("precio-desc");
    await expect(page).toHaveURL("/catalogo?orden=precio-desc");
    await expect(tarjetas(page).first()).toHaveAttribute(
      "href",
      "/producto/ebano",
    );
    await expect(tarjetas(page).last()).toHaveAttribute(
      "href",
      "/producto/rosa-de-batey",
    );
  });

  test("flujo completo: añadir, cantidad, vaciar y CTA de pago deshabilitado", async ({
    page,
  }) => {
    // Catálogo → ficha de producto (primer resultado del orden por defecto).
    await test.step("catálogo → ficha de producto", async () => {
      await page.goto("/catalogo");
      await tarjetas(page).first().click();
      await expect(page).toHaveURL(/\/producto\/.+/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    const nombreProducto = (
      await page.getByRole("heading", { level: 1 }).textContent()
    )!.trim();

    // Añadir al carrito: confirmación visible + contador de cabecera ≥ 1.
    await test.step("«Añadir al carrito» confirma y sube el contador", async () => {
      await page
        .getByRole("button", { name: "Añadir al carrito", exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText(
        "Añadido al carrito",
      );
      await expect(
        page.getByRole("button", {
          name: "Carrito, 1 artículo",
          exact: true,
        }),
      ).toBeVisible();
    });

    // Abrir el carrito desde la cabecera: ítem presente + CTA de pago.
    await test.step("el carrito de cabecera muestra el ítem y el pago deshabilitado", async () => {
      await page
        .getByRole("button", { name: "Carrito, 1 artículo", exact: true })
        .click();
      const dialogo = page.getByRole("dialog", { name: "Tu carrito" });
      await expect(dialogo).toBeVisible();
      await expect(
        dialogo.getByRole("heading", {
          level: 3,
          name: nombreProducto,
          exact: true,
        }),
      ).toBeVisible();

      // Microcopy LITERAL del código (components/carrito/Carrito.tsx).
      const pago = dialogo.getByRole("button", {
        name: "Proceder al pago",
        exact: true,
      });
      await expect(pago).toBeDisabled();
      await expect(
        dialogo.getByText(
          "La compra online estará disponible próximamente. Contáctanos por WhatsApp.",
          { exact: true },
        ),
      ).toBeVisible();
    });

    // Cambiar la cantidad actualiza unidades y total.
    await test.step("cambiar la cantidad actualiza el contador a 2", async () => {
      const dialogo = page.getByRole("dialog", { name: "Tu carrito" });
      await dialogo
        .getByRole("button", { name: "Aumentar cantidad", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Carrito, 2 artículos",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        dialogo.getByText("Total (2 artículos)", { exact: true }),
      ).toBeVisible();
    });

    // Vaciar: estado vacío + contador a 0.
    await test.step("«Vaciar carrito» deja el estado vacío y el contador a 0", async () => {
      const dialogo = page.getByRole("dialog", { name: "Tu carrito" });
      await dialogo
        .getByRole("button", { name: "Vaciar carrito", exact: true })
        .click();
      await expect(
        dialogo.getByText("Tu carrito está vacío", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: "Carrito, 0 artículos",
          exact: true,
        }),
      ).toBeVisible();
    });

    // La ruta /carrito refleja el mismo estado vacío.
    await test.step("la ruta /carrito muestra el estado vacío", async () => {
      await page.getByRole("button", { name: "Cerrar carrito", exact: true }).click();
      await page.goto("/carrito");
      await expect(
        page.getByRole("heading", { level: 1, name: "Tu carrito", exact: true }),
      ).toBeVisible();
      await expect(
        page.locator("main").getByText("Tu carrito está vacío", { exact: true }),
      ).toBeVisible();
    });
  });

  test('el conmutador de tema aplica data-theme="dark"', async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");

    // Preferencia inicial: `system` (localStorage vacío + esquema claro del
    // agente) → etiqueta «Cambiar a modo claro».
    await expect(html).toHaveAttribute("data-theme", "light");

    // Ciclo del conmutador (D-TEMA-2): system → light → dark.
    await page
      .getByRole("button", { name: "Cambiar a modo claro", exact: true })
      .click();
    await expect(html).toHaveAttribute("data-theme", "light");

    await page
      .getByRole("button", { name: "Cambiar a modo oscuro", exact: true })
      .click();
    await expect(html).toHaveAttribute("data-theme", "dark");

    // La preferencia persiste en localStorage y el script anti-FOUC la
    // reaplica en la recarga.
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });
});
