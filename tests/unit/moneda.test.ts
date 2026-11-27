import { describe, expect, it } from "vitest";
import { estaDisponible, visibleEnTienda } from "@/lib/catalogo/disponibilidad";
import {
  importeVisible,
  leerPreferencia,
  usdACup,
  validarTasa,
  valorCookie,
} from "@/lib/moneda/conversion";
import { formatearImporte, formatearNumero } from "@/lib/moneda/formato";

/** Suite F3-C2 · disponibilidad pública y moneda (puro: sin BD). */

describe("visibilidad y disponibilidad (tabla de la spec §2)", () => {
  it("ocultos y descontinuados no aparecen en la tienda", () => {
    expect(visibleEnTienda({ oculto: true, estado: "activo" })).toBe(false);
    expect(visibleEnTienda({ oculto: false, estado: "descontinuado" })).toBe(false);
    expect(visibleEnTienda({ oculto: false, estado: "agotado" })).toBe(true);
    expect(visibleEnTienda({ oculto: false, estado: "activo" })).toBe(true);
  });

  it("agotado si lo marca el admin o si no queda stock", () => {
    expect(estaDisponible({ estado: "agotado", stock: 10 })).toBe(false);
    expect(estaDisponible({ estado: "activo", stock: 0 })).toBe(false);
    expect(estaDisponible({ estado: "activo", stock: 1 })).toBe(true);
  });
});

describe("conversión USD → CUP", () => {
  it("redondea al peso entero", () => {
    expect(usdACup(60, 325)).toBe(19500);
    expect(usdACup(47.5, 325)).toBe(15438); // 15 437,5 → 15 438
    expect(usdACup(19.99, 330.25)).toBe(6602); // 6 601,70 → 6 602
  });

  it("sólo convierte si se eligió CUP y hay tasa", () => {
    expect(importeVisible(60, "CUP", 325)).toEqual({ valor: 19500, moneda: "CUP" });
    expect(importeVisible(60, "CUP", null)).toEqual({ valor: 60, moneda: "USD" });
    expect(importeVisible(60, "USD", 325)).toEqual({ valor: 60, moneda: "USD" });
  });

  it("la cookie desconocida equivale a USD", () => {
    expect(leerPreferencia("cup")).toBe("CUP");
    expect(leerPreferencia("usd")).toBe("USD");
    expect(leerPreferencia("<script>")).toBe("USD");
    expect(leerPreferencia(undefined)).toBe("USD");
    expect(valorCookie("CUP")).toBe("cup");
  });
});

describe("validarTasa", () => {
  it("acepta enteros, decimales con punto o coma y espacios de miles", () => {
    expect(validarTasa("325")).toEqual({ ok: true, tasa: 325 });
    expect(validarTasa("325,50")).toEqual({ ok: true, tasa: 325.5 });
    expect(validarTasa(" 1 200 ")).toEqual({ ok: true, tasa: 1200 });
  });

  it("rechaza vacío, cero, negativos, más de 2 decimales y valores absurdos", () => {
    expect(validarTasa("").ok).toBe(false);
    expect(validarTasa("0").ok).toBe(false);
    expect(validarTasa("-5").ok).toBe(false);
    expect(validarTasa("325.555").ok).toBe(false);
    expect(validarTasa("abc").ok).toBe(false);
    expect(validarTasa("100001").ok).toBe(false);
  });
});

describe("formato del dinero (corrección 05/11/2026)", () => {
  const ESP = " "; // espacio duro
  it("caso del cliente: 50 USD a 950 CUP por USD son 47 500 CUP", () => {
    expect(formatearImporte(usdACup(50, 950), "CUP")).toBe(`47${ESP}500${ESP}CUP`);
    expect(formatearImporte(50, "USD")).toBe(`50,00${ESP}USD`);
  });

  it("miles con espacio, decimales con coma y sin símbolo $", () => {
    expect(formatearNumero(1234567.5, 2)).toBe(`1${ESP}234${ESP}567,50`);
    expect(formatearNumero(999)).toBe("999");
    expect(formatearNumero(-1500)).toBe(`-1${ESP}500`);
    expect(formatearImporte(52250, "CUP")).not.toContain("$");
  });
});
