import { describe, expect, it } from "vitest";
import {
  LONGITUD_MAXIMA,
  LONGITUD_MINIMA,
  hashContrasena,
  longitudClaveValida,
  verificarContrasena,
} from "@/lib/auth/contrasena";
import {
  emailValido,
  normalizarEmail,
  validarNext,
} from "@/lib/auth/validadores";

/**
 * Tests unitarios de identidad (spec F3-B §5 y §9).
 * Sólo lógica pura: nada aquí toca la BD ni `next/headers`.
 * Las suites existentes (catalogo, integracion, E2E) NO se tocan.
 */

describe("contraseñas (scrypt nativo)", () => {
  it("hashea y verifica la misma contraseña", async () => {
    const hash = await hashContrasena("ClaveSegura-2026");
    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    await expect(
      verificarContrasena("ClaveSegura-2026", hash),
    ).resolves.toBe(true);
  });

  it("rechaza una contraseña distinta", async () => {
    const hash = await hashContrasena("ClaveSegura-2026");
    await expect(
      verificarContrasena("OtraClave-2026", hash),
    ).resolves.toBe(false);
  });

  it("dos hashes de la misma contraseña son distintos (sal aleatoria)", async () => {
    const [a, b] = await Promise.all([
      hashContrasena("ClaveSegura-2026"),
      hashContrasena("ClaveSegura-2026"),
    ]);
    expect(a).not.toBe(b);
  });

  it("el formato guarda sal de 16 B y clave de 64 B en base64", async () => {
    const hash = await hashContrasena("ClaveSegura-2026");
    const [, , , , salB64, claveB64] = hash.split("$");
    expect(Buffer.from(salB64, "base64")).toHaveLength(16);
    expect(Buffer.from(claveB64, "base64")).toHaveLength(64);
  });

  it("un hash corrupto devuelve false sin lanzar", async () => {
    const corruptos = [
      "",
      "no-es-un-hash",
      "scrypt$abc",
      "bcrypt$16384$8$1$c2FsdGFuZQ==$a2xhdW5zZQ==",
    ];
    for (const corrupto of corruptos) {
      await expect(
        verificarContrasena("ClaveSegura-2026", corrupto),
      ).resolves.toBe(false);
    }
  });

  it("longitudClaveValida cubre los bordes 8 y 128", () => {
    expect(longitudClaveValida("a".repeat(LONGITUD_MINIMA - 1))).toBe(false);
    expect(longitudClaveValida("a".repeat(LONGITUD_MINIMA))).toBe(true);
    expect(longitudClaveValida("a".repeat(LONGITUD_MAXIMA))).toBe(true);
    expect(longitudClaveValida("a".repeat(LONGITUD_MAXIMA + 1))).toBe(false);
  });

  it("hashContrasena rechaza claves fuera de rango", async () => {
    await expect(hashContrasena("corta")).rejects.toThrow(
      "La contraseña debe tener entre 8 y 128 caracteres.",
    );
  });
});

describe("validadores de identidad", () => {
  it("normalizarEmail recorta y pasa a minúsculas", () => {
    expect(normalizarEmail("  Cliente@Ejemplo.cu ")).toBe("cliente@ejemplo.cu");
  });

  it("emailValido acepta válidos y rechaza inválidos", () => {
    expect(emailValido("cliente@ejemplo.cu")).toBe(true);
    expect(emailValido("a.b+c@sub.dominio.cu")).toBe(true);
    expect(emailValido("sin-arroba.ejemplo.cu")).toBe(false);
    expect(emailValido("cliente@sin-punto")).toBe(false);
    expect(emailValido("clien te@ejemplo.cu")).toBe(false);
    expect(emailValido("")).toBe(false);
    expect(emailValido(`${"a".repeat(250)}@ejemplo.cu`)).toBe(false); // > 254
  });

  it("validarNext acepta rutas internas y rechaza el resto (anti open-redirect)", () => {
    expect(validarNext("/dashboard")).toBe("/dashboard");
    expect(validarNext("/")).toBe("/");
    expect(validarNext("/catalogo?buscar=sol")).toBe("/catalogo?buscar=sol");
    expect(validarNext("https://evil.example")).toBeNull();
    expect(validarNext("//evil.example")).toBeNull();
    expect(validarNext("/\\evil.example")).toBeNull();
    expect(validarNext("dashboard")).toBeNull();
    expect(validarNext("")).toBeNull();
    expect(validarNext(null)).toBeNull();
    expect(validarNext(undefined)).toBeNull();
    expect(validarNext(42)).toBeNull();
    expect(validarNext("/con\nsalto")).toBeNull();
    expect(validarNext('/con"comilla')).toBeNull();
  });
});
