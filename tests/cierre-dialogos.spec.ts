import { test, expect } from "@playwright/test";

test.describe("Peache Perfumes — cierre de diálogos (menú y filtros)", () => {
  test("el botón «Cerrar menú» cierra el menú móvil", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.setViewportSize({ width: 390, height: 844 });

    // Abrir menú móvil
    const botonMenu = page.getByRole("button", { name: /Abrir menú/ });
    await expect(botonMenu).toBeVisible();
    await botonMenu.click();

    // Verificar que el diálogo se abrió — botón de cerrar DENTRO del diálogo
    const dialogoMenu = page.getByRole("dialog", { name: "Menú" });
    await expect(dialogoMenu).toBeVisible();
    const cerrarMenu = dialogoMenu.getByRole("button", { name: "Cerrar menú" });
    await expect(cerrarMenu).toBeVisible();

    // Cerrar menú
    await cerrarMenu.click();

    // Verificar que el diálogo se cerró
    await expect(botonMenu).toBeVisible();
    await expect(dialogoMenu).not.toBeVisible();
  });

  test("el botón «Cerrar filtros» cierra la hoja de filtros", async ({ page }) => {
    await page.goto("http://localhost:3000/catalogo");
    await page.setViewportSize({ width: 390, height: 844 });

    // Abrir hoja de filtros (móvil)
    const triggerFiltros = page.getByRole("button", { name: /^Filtros$/ });
    await expect(triggerFiltros).toBeVisible();
    await triggerFiltros.click();

    // Verificar que el diálogo se abrió
    const dialogoFiltros = page.getByRole("dialog", { name: "Filtros" });
    await expect(dialogoFiltros).toBeVisible();
    const cerrarFiltros = dialogoFiltros.getByRole("button", { name: "Cerrar filtros" });
    await expect(cerrarFiltros).toBeVisible();

    // Cerrar filtros
    await cerrarFiltros.click();

    // Verificar que el diálogo se cerró
    await expect(triggerFiltros).toBeVisible();
    await expect(dialogoFiltros).not.toBeVisible();
  });

  test("la tecla Esc cierra el menú móvil", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.getByRole("button", { name: /Abrir menú/ }).click();
    const dialogoMenu = page.getByRole("dialog", { name: "Menú" });
    await expect(dialogoMenu).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("button", { name: /Abrir menú/ })).toBeVisible();
    await expect(dialogoMenu).not.toBeVisible();
  });
});
