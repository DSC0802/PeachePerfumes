import { test, expect, type Page } from "@playwright/test";

/**
 * E2E del panel admin (F3-C): CRUD de productos con foto, reportes, clientes,
 * CSV y protección. Requiere ADMIN_EMAIL/ADMIN_PASSWORD en .env.local y
 * FUENTE_CATALOGO=postgres (si no, el bloque se salta con motivo visible).
 * Los productos creados usan slug `e2e-…`; los borra tests/limpieza-global.ts.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// PNG 1×1 válido (cabecera real: el servidor valida magic bytes).
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function entrarComoAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(ADMIN_EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });
}

test.describe("Panel admin", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Sin ADMIN_EMAIL/ADMIN_PASSWORD en .env.local");
  test.skip(process.env.FUENTE_CATALOGO !== "postgres", "La tienda no usa FUENTE_CATALOGO=postgres");

  test("resumen con datos reales y navegación lateral", async ({ page }) => {
    await entrarComoAdmin(page);
    await expect(page.getByRole("heading", { level: 1, name: "Panel de administración" })).toBeVisible();
    await expect(page.getByText(`Sesión iniciada como ${ADMIN_EMAIL}.`)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Productos en catálogo" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ventas de hoy" })).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Secciones del panel" });
    await expect(nav.getByRole("link", { name: "Resumen" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Reportes" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Reportes" })).toBeVisible();
    await expect(page.getByRole("figure").first()).toBeVisible();

    await page.goto("/dashboard/clientes");
    await expect(page.getByRole("heading", { level: 1, name: "Clientes" })).toBeVisible();
    await expect(page.getByRole("rowheader").filter({ hasText: ADMIN_EMAIL! })).toBeVisible();
  });

  test("validación: el formulario vacío marca los errores", async ({ page }) => {
    await entrarComoAdmin(page);
    await page.goto("/dashboard/productos/nuevo");
    await page.getByLabel("Marca", { exact: true }).fill("");
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page.getByText("Revisa los campos marcados.", { exact: false })).toBeVisible();
    await expect(page.getByText("Escribe el nombre del perfume.")).toBeVisible();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL("/dashboard/productos/nuevo");
  });

  test("crear con foto → tienda → editar → quitar → restaurar", async ({ page }) => {
    test.setTimeout(90_000);
    const marca = Date.now().toString(36);
    const nombre = `E2E Perfume ${marca}`;
    const slug = `e2e-perfume-${marca}`;

    await entrarComoAdmin(page);

    // ---- Crear ----
    await page.goto("/dashboard/productos/nuevo");
    await page.getByLabel("Nombre", { exact: true }).fill(nombre);
    await expect(page.getByLabel("Dirección en la tienda (slug)", { exact: true })).toHaveValue(slug);
    await page.getByLabel("Descripción", { exact: true }).fill("Perfume de prueba creado por E2E.");
    await page.getByLabel("Precio (USD)", { exact: true }).fill("42.50");
    await page.getByLabel("Tamaño (ml)", { exact: true }).fill("50");
    await page.getByLabel("Stock (unidades)", { exact: true }).fill("3");
    await page.getByLabel("Categoría", { exact: true }).selectOption({ index: 1 });
    await page.getByLabel("Familia olfativa", { exact: true }).selectOption("floral");
    await page.getByLabel("Notas de salida", { exact: true }).fill("rosa, bergamota");
    await page.getByLabel("Subir foto", { exact: true }).setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: PNG_1X1 });
    await page.getByLabel("Descripción de la foto (texto alternativo)", { exact: true }).fill("Frasco de prueba");
    await page.getByRole("button", { name: "Crear producto" }).click();

    await expect(page).toHaveURL(/\/dashboard\/productos\?guardado=/, { timeout: 15_000 });
    await expect(page.getByRole("status")).toHaveText(`«${nombre}» se guardó correctamente.`);

    // ---- Visible en la tienda ----
    const ficha = await page.goto(`/producto/${slug}`);
    expect(ficha?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: new RegExp(nombre) })).toBeVisible();

    // ---- Editar (precio) y comprobar la foto servida ----
    await page.goto(`/dashboard/productos?q=${encodeURIComponent(nombre)}`);
    await page.getByRole("link", { name: `Editar ${nombre}` }).click();
    await expect(page.getByRole("heading", { level: 1, name: `Editar «${nombre}»` })).toBeVisible();
    const srcFoto = await page.locator("form img").first().getAttribute("src");
    expect(srcFoto).toMatch(/^\/imagenes\/[0-9a-f-]{36}\.png$/);
    const foto = await page.request.get(srcFoto!);
    expect(foto.status()).toBe(200);
    expect(foto.headers()["content-type"]).toBe("image/png");

    await page.getByLabel("Precio (USD)", { exact: true }).fill("45");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL(/guardado=/, { timeout: 15_000 });
    const fila = page.getByRole("row").filter({ hasText: nombre });
    await expect(fila).toContainText("45");

    // ---- Quitar (ocultar) con confirmación ----
    await page.goto(`/dashboard/productos?q=${encodeURIComponent(nombre)}`);
    page.once("dialog", (dialogo) => dialogo.accept());
    await page.getByRole("button", { name: `Quitar ${nombre} de la tienda` }).click();
    await expect(page.getByRole("row").filter({ hasText: nombre })).toHaveCount(0);
    // La ficha muestra el «no encontrado» (con loading.tsx el estado es un soft-404:
    // 200 + noindex, ver docs de Next 16 loading.md §Status codes).
    await page.goto(`/producto/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: "No encontramos este perfume." })).toBeVisible();
    await page.goto(`/catalogo?q=${encodeURIComponent(nombre)}`);
    await expect(page.locator(`main a[href="/producto/${slug}"]`)).toHaveCount(0);

    // ---- Restaurar ----
    await page.goto(`/dashboard/productos?q=${encodeURIComponent(nombre)}&ocultos=1`);
    await expect(page.getByRole("row").filter({ hasText: nombre })).toContainText("Oculto");
    await page.getByRole("button", { name: `Restaurar ${nombre}` }).click();
    await expect(page.getByRole("row").filter({ hasText: nombre })).toContainText("En tienda");
    await page.goto(`/producto/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: new RegExp(nombre) })).toBeVisible();
  });

  test("un error de validación no pierde la foto ni los selects ya elegidos", async ({ page }) => {
    // Regresión (05/11/2026): React 19 reseteaba el formulario tras el error y el
    // producto acababa guardándose sin foto aunque la vista previa la mostraba.
    test.setTimeout(60_000);
    const marca = Date.now().toString(36);
    const nombre = `E2E Perfume ${marca}`;
    await entrarComoAdmin(page);
    await page.goto("/dashboard/productos/nuevo");
    await page.getByLabel("Nombre", { exact: true }).fill(nombre);
    await page.getByLabel("Descripción", { exact: true }).fill("Prueba de regresión.");
    await page.getByLabel("Precio (USD)", { exact: true }).fill("20");
    await page.getByLabel("Categoría", { exact: true }).selectOption({ index: 1 });
    await page.getByLabel("Familia olfativa", { exact: true }).selectOption("oriental");
    await page.getByLabel("Notas de salida", { exact: true }).fill("ámbar");
    await page.getByLabel("Subir foto", { exact: true }).setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: PNG_1X1 });
    // Sin texto alternativo → error de validación.
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page.getByText("Describe la foto para lectores de pantalla", { exact: false })).toBeVisible();
    expect(await page.getByLabel("Subir foto", { exact: true }).evaluate((e: HTMLInputElement) => e.files?.length)).toBe(1);
    await expect(page.getByLabel("Familia olfativa", { exact: true })).toHaveValue("oriental");

    await page.getByLabel("Descripción de la foto (texto alternativo)", { exact: true }).fill("Frasco de prueba");
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page).toHaveURL(/guardado=/, { timeout: 15_000 });
    await page.getByRole("link", { name: `Editar ${nombre}` }).click();
    expect(await page.locator("form img").first().getAttribute("src")).toMatch(/^\/imagenes\/[0-9a-f-]{36}\.png$/);
  });

  test("exporta el inventario en CSV", async ({ page }) => {
    await entrarComoAdmin(page);
    const respuesta = await page.request.get("/dashboard/reportes/csv");
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("text/csv");
    expect(respuesta.headers()["content-disposition"]).toMatch(/attachment; filename="inventario-peache-/);
    const cuerpo = await respuesta.text();
    expect(cuerpo.replace("﻿", "").split("\r\n")[0]).toBe(
      "slug;marca;nombre;categoria;familia;ml;precio_usd;stock;valor_usd;estado;oculto",
    );
  });
});

test.describe("Protección del panel", () => {
  test("invitado recibe 403 en subrutas y en el CSV", async ({ page }) => {
    for (const ruta of ["/dashboard/productos", "/dashboard/productos/nuevo", "/dashboard/reportes/csv"]) {
      const respuesta = await page.request.get(ruta, { maxRedirects: 0 });
      expect(respuesta.status(), ruta).toBe(403);
    }
  });

  test("la ruta de imágenes rechaza nombres no válidos", async ({ page }) => {
    for (const ruta of ["/imagenes/..%2F.env.local", "/imagenes/foto.svg", "/imagenes/00000000-0000-4000-8000-000000000000.png"]) {
      const respuesta = await page.request.get(ruta);
      expect(respuesta.status(), ruta).toBe(404);
    }
  });
});

/* ---------------------------------------------------------------------------
   F3-C2 · Moneda y disponibilidad (spec 2026-11-05-f3c2-disponibilidad-moneda)
   La tasa de prueba es 987.65 (la borra tests/limpieza-global.ts).
   --------------------------------------------------------------------------- */
test.describe("Moneda y disponibilidad", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Sin ADMIN_EMAIL/ADMIN_PASSWORD en .env.local");
  test.skip(process.env.FUENTE_CATALOGO !== "postgres", "La tienda no usa FUENTE_CATALOGO=postgres");

  test("el admin fija la tasa y la tienda convierte a CUP y lo recuerda", async ({ page }) => {
    test.setTimeout(60_000);
    await entrarComoAdmin(page);
    await page.goto("/dashboard/ajustes");
    await page.getByLabel("CUP por 1 USD", { exact: true }).fill("987.65");
    await page.getByRole("button", { name: "Guardar tasa" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Tasa guardada" })).toBeVisible();
    await expect(page.getByRole("rowheader").filter({ hasText: "Vigente" })).toBeVisible();

    await page.goto("/catalogo?orden=precio-asc");
    const moneda = page.getByRole("group", { name: "Moneda de los precios" });
    await expect(moneda.getByRole("button", { name: "USD" })).toHaveAttribute("aria-pressed", "true");
    const primerPrecioUsd = Number(await page.locator('main a[href^="/producto/"] data').first().getAttribute("value"));

    await moneda.getByRole("button", { name: "CUP" }).click();
    await expect(moneda.getByRole("button", { name: "CUP" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('main a[href^="/producto/"] data').first()).toHaveAttribute(
      "value",
      String(Math.round(primerPrecioUsd * 987.65)),
    );

    await page.reload();
    await expect(
      page.getByRole("group", { name: "Moneda de los precios" }).getByRole("button", { name: "CUP" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("sin stock se ve «Agotado» y no se compra; descontinuado desaparece", async ({ page }) => {
    test.setTimeout(90_000);
    const marca = Date.now().toString(36);
    const nombre = `E2E Perfume ${marca}`;
    const slug = `e2e-perfume-${marca}`;
    await entrarComoAdmin(page);

    await page.goto("/dashboard/productos/nuevo");
    await page.getByLabel("Nombre", { exact: true }).fill(nombre);
    await page.getByLabel("Descripción", { exact: true }).fill("Agotado de prueba.");
    await page.getByLabel("Precio (USD)", { exact: true }).fill("30");
    await page.getByLabel("Stock (unidades)", { exact: true }).fill("0");
    await page.getByLabel("Categoría", { exact: true }).selectOption({ index: 1 });
    await page.getByLabel("Familia olfativa", { exact: true }).selectOption("gourmand");
    await page.getByLabel("Notas de salida", { exact: true }).fill("vainilla");
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page).toHaveURL(/guardado=/, { timeout: 15_000 });

    await page.goto(`/producto/${slug}`);
    await expect(page.getByRole("button", { name: "Agotado" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Añadir al carrito" })).toHaveCount(0);
    await expect(page.getByText("Ahora mismo no lo tenemos.", { exact: false })).toBeVisible();

    await page.goto(`/catalogo?q=${encodeURIComponent(nombre)}`);
    await expect(page.locator(`main a[href="/producto/${slug}"]`)).toContainText("Agotado");

    // Descontinuado: fuera de la tienda.
    await page.goto(`/dashboard/productos?q=${encodeURIComponent(nombre)}`);
    await page.getByLabel(`Nuevo estado de ${nombre}`).selectOption("descontinuado");
    // Esperar a que la acción termine antes de navegar (si no, se aborta).
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST"),
      page.getByRole("button", { name: `Aplicar estado a ${nombre}` }).click(),
    ]);
    await expect(page.getByLabel(`Nuevo estado de ${nombre}`)).toHaveValue("descontinuado");
    await page.goto(`/producto/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: "No encontramos este perfume." })).toBeVisible();
    await page.goto(`/catalogo?q=${encodeURIComponent(nombre)}`);
    await expect(page.locator(`main a[href="/producto/${slug}"]`)).toHaveCount(0);
  });
});

/* ---------------------------------------------------------------------------
   F3-D · Pedidos (spec 2026-11-05-f3d-pedidos-design)
   Cliente de prueba e2e-…@ejemplo.cu (la limpieza borra sus pedidos y
   devuelve el stock). Si la tienda no tiene WhatsApp, se pone el número
   reservado 5300000000 y la limpieza lo quita.
   --------------------------------------------------------------------------- */
test.describe("Pedidos", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Sin ADMIN_EMAIL/ADMIN_PASSWORD en .env.local");
  test.skip(process.env.FUENTE_CATALOGO !== "postgres", "La tienda no usa FUENTE_CATALOGO=postgres");

  test("sin sesión, confirmar pedido lleva al login y vuelve", async ({ page }) => {
    const respuesta = await page.goto("/pedido");
    expect(respuesta?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/login\?next=%2Fpedido|\/login\?next=\/pedido/);
  });

  test("cliente pide → vale por WhatsApp → admin lo lleva a entregado", async ({ browser }) => {
    test.setTimeout(120_000);

    // ---- Admin: la tienda necesita un número de WhatsApp ----
    const admin = await (await browser.newContext()).newPage();
    await entrarComoAdmin(admin);
    await admin.goto("/dashboard/ajustes");
    const campoWhatsapp = admin.getByLabel("WhatsApp de la tienda", { exact: true });
    let numeroTienda = await campoWhatsapp.inputValue();
    if (!numeroTienda) {
      numeroTienda = "5300000000";
      await campoWhatsapp.fill(numeroTienda);
      await admin.getByRole("button", { name: "Guardar número" }).click();
      await expect(admin.getByRole("status").filter({ hasText: "Número guardado" })).toBeVisible();
    }

    // ---- Cliente nuevo ----
    const cliente = await (await browser.newContext()).newPage();
    const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@ejemplo.cu`;
    await cliente.goto("/registro");
    await cliente.getByLabel("Email").fill(email);
    await cliente.getByLabel("Contraseña").fill("ClaveE2E-2026");
    await cliente.getByRole("button", { name: "Crear cuenta" }).click();
    await cliente.waitForURL((url) => url.pathname !== "/registro");

    await cliente.goto("/producto/vainilla-de-playa");
    await cliente.getByRole("button", { name: "Añadir al carrito", exact: true }).click();
    await expect(cliente.getByRole("button", { name: "Carrito, 1 artículo", exact: true })).toBeVisible();

    await cliente.goto("/pedido");
    await expect(cliente.getByRole("heading", { level: 1, name: "Confirmar pedido" })).toBeVisible();
    await expect(cliente.locator("main").getByText("Vainilla de Playa", { exact: false }).first()).toBeVisible();
    await cliente.getByRole("button", { name: "Confirmar pedido" }).click();

    await expect(cliente).toHaveURL(/\/pedidos\/\d+\?nuevo=1/, { timeout: 15_000 });
    const numero = Number(new URL(cliente.url()).pathname.split("/").pop());
    const enviar = cliente.getByRole("link", { name: "Enviar el vale por WhatsApp" });
    const href = (await enviar.getAttribute("href")) ?? "";
    expect(href.startsWith(`https://wa.me/${numeroTienda}?text=`)).toBe(true);
    const texto = decodeURIComponent(href.split("?text=")[1]);
    expect(texto).toContain(`Nº ${String(numero).padStart(4, "0")}`);
    expect(texto).toContain("Vainilla de Playa");
    expect(texto).toContain("Pago en efectivo al recibir.");
    await expect(cliente.getByRole("button", { name: "Carrito, 0 artículos", exact: true })).toBeVisible();

    await cliente.goto("/pedidos");
    await expect(cliente.getByRole("link", { name: new RegExp(`Nº ${String(numero).padStart(4, "0")}`) })).toContainText("Pendiente");

    // ---- Admin: notificación y estados ----
    await admin.goto("/dashboard/notificaciones");
    await expect(admin.getByRole("link", { name: `Nº ${String(numero).padStart(4, "0")}` })).toBeVisible();
    await admin.goto(`/dashboard/pedidos/${numero}`);
    // Un paso con el botón principal y luego un salto directo a «Entregado» (D-F3D-SALTOS).
    await admin.getByRole("button", { name: "Marcar como «Confirmado»" }).click();
    await expect(admin.getByText("Confirmado", { exact: true }).first()).toBeVisible();
    await expect(admin.getByLabel("Saltar a")).toHaveValue("entregado");
    admin.once("dialog", (dialogo) => dialogo.accept());
    await admin.getByRole("button", { name: "Cambiar estado" }).click();
    await expect(admin.getByRole("heading", { name: "Siguiente paso" })).toHaveCount(0);
    await expect(admin.getByText("Entregado", { exact: true }).first()).toBeVisible();
    await expect(admin.getByRole("button", { name: "Cancelar pedido" })).toHaveCount(0);

    await cliente.goto(`/pedidos/${numero}`);
    await expect(cliente.getByRole("heading", { name: /Estado: Entregado/ })).toBeVisible();

    // ---- F3-E: la venta entregada aparece en el panel, los reportes y el CSV ----
    await admin.goto("/dashboard");
    await expect(admin.getByRole("heading", { name: "Ventas de hoy" })).toBeVisible();
    await expect(admin.getByRole("figure").filter({ hasText: "Ventas de los últimos 14 días" })).toBeVisible();
    await admin.goto("/dashboard/reportes?periodo=7d");
    await expect(
      admin.getByRole("region", { name: "Más vendidos" }).getByRole("rowheader", { name: "Vainilla de Playa" }),
    ).toBeVisible();
    const csv = await admin.request.get("/dashboard/reportes/ventas-csv");
    expect(csv.status()).toBe(200);
    const filas = (await csv.text()).replace(/^﻿/, "").split(/\r\n/);
    expect(filas[0]).toBe("pedido;fecha_entrega;cliente;articulos;total_usd;total_cup_hoy");
    expect(filas.some((fila) => fila.startsWith(`${numero};`) && fila.includes(email))).toBe(true);
  });
});
