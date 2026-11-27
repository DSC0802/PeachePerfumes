import { test, expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const ETIQUETAS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function emailAleatorio(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-${ts}-${rand}@ejemplo.cu`;
}

const CONTRASENA_E2E = "ClaveE2E-2026";

async function registrar(page: Page, email: string) {
  await page.goto(`/registro`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(CONTRASENA_E2E);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  // La server action redirige al terminar: esperar a salir de /registro.
  await page.waitForURL((url: URL) => url.pathname !== "/registro");
}

async function iniciarSesion(page: Page, email: string, password?: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password ?? CONTRASENA_E2E);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL((url: URL) => url.pathname !== "/login");
}

function cuentaVisible(page: Page) {
  return page.locator("header").filter({ visible: true });
}

test.describe("Flujos de identidad (registro → login → perfil → logout)", () => {
  test("registro → login → perfil → logout → re-login", async ({ page }) => {
    const email = emailAleatorio();

    // Registro
    await registrar(page, email);
    await expect(page).toHaveURL("/");
    await expect(
      cuentaVisible(page).getByRole("link", { name: "Mi perfil" }),
    ).toBeVisible();

    // Ir a perfil
    await page.goto("/perfil");
    await expect(
      page.getByRole("heading", { level: 1, name: "Mi perfil" }),
    ).toBeVisible();
    await page.getByLabel("Nombre").fill("Cliente E2E");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("status")).toHaveText("Cambios guardados.");

    // Cerrar sesión vía navbar
    await page.goto("/");
    await cuentaVisible(page)
      .getByRole("button", { name: "Cerrar sesión" })
      .click();
    await expect(page).toHaveURL("/");
    await expect(
      cuentaVisible(page).getByRole("link", { name: "Iniciar sesión" }),
    ).toBeVisible();

    // Re-login
    await iniciarSesion(page, email);
    await expect(page).toHaveURL("/");
  });

  test("login con ?next= redirige al path solicitado", async ({ page }) => {
    const email = emailAleatorio();
    await registrar(page, email);
    await page.goto("/login?next=/perfil");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA_E2E);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL("/perfil");
  });

  test("login con contraseña incorrecta muestra error genérico", async ({ page }) => {
    const email = emailAleatorio();
    await registrar(page, email);
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill("ClaveErronea-2026");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("alert").filter({ hasText: "Email o contraseña incorrectos." }),
    ).toHaveText("Email o contraseña incorrectos.");
  });

  test("registro con email ya registrado muestra error inline", async ({ page }) => {
    const email = emailAleatorio();
    await registrar(page, email);
    await page.goto("/registro");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA_E2E);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/registro/);
    await expect(
      page.getByRole("alert").filter({ hasText: "Ese email ya tiene una cuenta. Inicia sesión." }),
    ).toHaveText("Ese email ya tiene una cuenta. Inicia sesión.");
  });
});

test.describe("Admin → Dashboard", () => {
  test("admin: login → /dashboard con bienvenida y navegación del panel", async ({ page }) => {
    const email = process.env.ADMIN_EMAIL;
    const contrasena = process.env.ADMIN_PASSWORD;
    test.skip(!email || !contrasena, "Sin ADMIN_EMAIL/ADMIN_PASSWORD en .env.local");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Contraseña").fill(contrasena!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    // Login de admin: scrypt + render con 6 workers puede pasar de 5 s en dev.
    await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: "Panel de administración" }),
    ).toBeVisible();
    await expect(page.getByText(`Sesión iniciada como ${email}.`)).toBeVisible();
    // F3-C: el índice «Próximamente» de F3-B dio paso al panel real.
    await expect(
      page.getByRole("navigation", { name: "Secciones del panel" }).getByRole("link", { name: "Productos" }),
    ).toBeVisible();
  });
});

test.describe("403 real en /dashboard", () => {
  test("invitado en /dashboard recibe 403 real", async ({ page }) => {
    const respuesta = await page.goto("/dashboard");
    expect(respuesta, "GET /dashboard no respondió").not.toBeNull();
    expect(respuesta!.status()).toBe(403);
    await expect(
      page.getByRole("heading", { name: "Esta zona es solo para administración" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/login?next=/dashboard",
    );
  });

  test("cliente recibe 403", async ({ page }) => {
    const email = emailAleatorio();
    await registrar(page, email);
    const respuesta = await page.goto("/dashboard");
    expect(respuesta!.status()).toBe(403);
    await expect(
      page.getByRole("heading", { name: "Esta zona es solo para administración" }),
    ).toBeVisible();
  });
});

test.describe("Cookie de sesión", () => {
  test("cookie peache-sesion: httpOnly, SameSite=Lax, expiración a 30 días", async ({
    page,
    context,
  }) => {
    const email = emailAleatorio();
    await registrar(page, email);
    const cookies = await context.cookies();
    const sesion = cookies.find((c) => c.name === "peache-sesion");
    expect(sesion, "existe la cookie peache-sesion").toBeDefined();
    expect(sesion!.httpOnly).toBe(true);
    expect(sesion!.sameSite).toBe("Lax");
    const esperada = Date.now() / 1000 + 2592000;
    expect(Math.abs(sesion!.expires - esperada)).toBeLessThan(3600);
  });
});

test.describe("Navbar por estado de sesión", () => {
  test("invitado: ve Iniciar sesión, no ve Mi perfil ni Dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(
      cuentaVisible(page).getByRole("link", { name: "Iniciar sesión" }),
    ).toBeVisible();
    await expect(
      cuentaVisible(page).getByRole("link", { name: "Mi perfil" }),
    ).toHaveCount(0);
  });

  test("con sesión cliente: ve Mi perfil, no ve Dashboard", async ({ page }) => {
    const email = emailAleatorio();
    await registrar(page, email);
    await expect(
      cuentaVisible(page).getByRole("link", { name: "Mi perfil" }),
    ).toBeVisible();
    await expect(
      cuentaVisible(page).getByRole("link", { name: "Panel" }),
    ).toHaveCount(0);
  });

  test("admin: ve Dashboard además de Mi perfil", async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminContrasena = process.env.ADMIN_PASSWORD;
    test.skip(!adminEmail || !adminContrasena, "Sin ADMIN_EMAIL/ADMIN_PASSWORD en .env.local");
    await page.goto("/login");
    await page.getByLabel("Email").fill(adminEmail!);
    await page.getByLabel("Contraseña").fill(adminContrasena!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    // Login de admin: scrypt + render con 6 workers puede pasar de 5 s en dev.
    await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });
    await expect(
      cuentaVisible(page).getByRole("link", { name: "Panel" }),
    ).toBeVisible();
  });
});

test.describe("Sesión caducada", () => {
  test("cookie inválida → aviso de sesión caducada en /login", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "peache-sesion",
        value: "token-falso-e2e",
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.goto("/perfil");
    await expect(page).toHaveURL(
      "/login?next=/perfil&aviso=expirada",
    );
    await expect(page.getByRole("status")).toHaveText(
      "Tu sesión ha caducado. Inicia sesión de nuevo.",
    );
  });
});

test.describe("Accesibilidad", () => {
  test("/login sin violaciones critical/serious (tema light)", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("peache-theme", "light");
    });
    const respuesta = await page.goto("/login");
    expect(respuesta, "GET /login no respondió").not.toBeNull();
    expect(respuesta!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    const resultado = await new AxeBuilder({ page })
      .withTags(ETIQUETAS_WCAG)
      .analyze();

    const esBloqueante = (impacto: string | null | undefined): boolean =>
      impacto !== "moderate" && impacto !== "minor";
    const bloqueantes = resultado.violations.filter((v) => esBloqueante(v.impact));
    const ignoradas = resultado.violations.filter((v) => !esBloqueante(v.impact));

    if (ignoradas.length > 0) {
      console.warn(
        `[axe] /login (light) — ${ignoradas.length} violación(es) moderate/minor NO bloqueante(s):\n` +
          ignoradas
            .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodo(s))`)
            .join("\n"),
      );
    }

    const resumen =
      bloqueantes.length === 0
        ? ""
        : `\nViolaciones bloqueantes en /login:\n` +
          bloqueantes
            .map((v) => `  - [${v.impact}] ${v.id}: ${v.help}\n` + v.nodes.map((n) => `      ${n.html}`).join("\n"))
            .join("\n");

    expect(bloqueantes, resumen).toEqual([]);
  });
});