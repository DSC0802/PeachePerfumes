import { describe, expect, it } from "vitest";
import { esTransicionValida, reservaStock, transicionesValidas } from "@/lib/pedidos/estados";
import { CANTIDAD_MAXIMA, normalizarLineas, revisarCarrito, type ProductoActual } from "@/lib/pedidos/revision";
import { enlaceWhatsApp, formatearNumeroPedido, textoVale, validarNumero } from "@/lib/pedidos/whatsapp";

/** Suite F3-D · pedidos (puro: sin BD). */

describe("máquina de estados", () => {
  it("cada estado puede ir a cualquiera posterior o cancelarse", () => {
    expect(transicionesValidas("pendiente")).toEqual([
      "confirmado",
      "en_preparacion",
      "en_camino",
      "entregado",
      "cancelado",
    ]);
    expect(transicionesValidas("en_preparacion")).toEqual(["en_camino", "entregado", "cancelado"]);
    expect(transicionesValidas("en_camino")).toEqual(["entregado", "cancelado"]);
    expect(transicionesValidas("entregado")).toEqual([]);
    expect(transicionesValidas("cancelado")).toEqual([]);
  });

  it("permite saltos hacia delante; rechaza retrocesos, quedarse igual y salir de un final", () => {
    expect(esTransicionValida("pendiente", "entregado")).toBe(true);
    expect(esTransicionValida("confirmado", "en_camino")).toBe(true);
    expect(esTransicionValida("en_camino", "confirmado")).toBe(false);
    expect(esTransicionValida("confirmado", "confirmado")).toBe(false);
    expect(esTransicionValida("confirmado", "pendiente")).toBe(false);
    expect(esTransicionValida("entregado", "cancelado")).toBe(false);
    expect(esTransicionValida("cancelado", "pendiente")).toBe(false);
  });

  it("todo lo no cancelado reserva stock", () => {
    expect(reservaStock("pendiente")).toBe(true);
    expect(reservaStock("entregado")).toBe(true);
    expect(reservaStock("cancelado")).toBe(false);
  });
});

const actual = (p: Partial<ProductoActual> & { slug: string }): ProductoActual => ({
  nombre: p.slug,
  marca: "M",
  tamano: "100 ml",
  precioUsd: 50,
  disponible: true,
  stock: 10,
  ...p,
});

describe("revisión del carrito", () => {
  it("une líneas repetidas, ignora cantidades no válidas y limita a 10", () => {
    expect(
      normalizarLineas([
        { slug: "a", cantidad: 6, precioVisto: 50 },
        { slug: "a", cantidad: 7, precioVisto: 50 },
        { slug: "b", cantidad: 0, precioVisto: 10 },
        { slug: "c", cantidad: 2.9, precioVisto: 10 },
      ]),
    ).toEqual([
      { slug: "a", cantidad: CANTIDAD_MAXIMA, precioVisto: 50 },
      { slug: "c", cantidad: 2, precioVisto: 10 },
    ]);
  });

  it("sin cambios: confirmable y total correcto", () => {
    const vale = revisarCarrito(
      [{ slug: "a", cantidad: 2, precioVisto: 47.5 }],
      new Map([["a", actual({ slug: "a", precioUsd: 47.5 })]]),
    );
    expect(vale).toMatchObject({ confirmable: true, conCambios: false, totalUsd: 95 });
  });

  it("avisa de precio nuevo, falta de stock y producto retirado", () => {
    const vale = revisarCarrito(
      [
        { slug: "a", cantidad: 1, precioVisto: 50 },
        { slug: "b", cantidad: 5, precioVisto: 20 },
        { slug: "c", cantidad: 1, precioVisto: 30 },
        { slug: "d", cantidad: 1, precioVisto: 30 },
      ],
      new Map([
        ["a", actual({ slug: "a", precioUsd: 55 })],
        ["b", actual({ slug: "b", precioUsd: 20, stock: 2 })],
        ["d", actual({ slug: "d", disponible: false, stock: 0 })],
      ]),
    );
    const [a, b, c, d] = vale.lineas;
    expect(a.avisos).toEqual([{ tipo: "precio", antes: 50, ahora: 55 }]);
    expect(b.avisos).toEqual([{ tipo: "cantidad", antes: 5, ahora: 2 }]);
    expect(c.incluida).toBe(false);
    expect(d.incluida).toBe(false);
    expect(vale.totalUsd).toBe(95);
    expect(vale.conCambios).toBe(true);
  });

  it("si nada sigue disponible, no se puede confirmar", () => {
    const vale = revisarCarrito([{ slug: "x", cantidad: 1, precioVisto: 10 }], new Map());
    expect(vale.confirmable).toBe(false);
  });
});

describe("vale de WhatsApp", () => {
  it("valida el número en formato internacional", () => {
    expect(validarNumero("+53 5555-1234")).toEqual({ ok: true, numero: "5355551234" });
    expect(validarNumero("1234").ok).toBe(false);
    expect(validarNumero("").ok).toBe(false);
  });

  it("escribe el vale con número, líneas, total y equivalencia CUP", () => {
    const texto = textoVale({
      numeroPedido: 7,
      cliente: "Ana Pérez",
      lineas: [
        { cantidad: 1, nombre: "Sauvage", tamano: "100 ml", precioUsd: 60 },
        { cantidad: 2, nombre: "Brisa de Coco", tamano: "100 ml", precioUsd: 47 },
      ],
      totalUsd: 154,
      tasa: 325,
      urlPedido: "http://localhost:3000/pedidos/7",
    });
    expect(formatearNumeroPedido(7)).toBe("Nº 0007");
    expect(texto).toContain("Nº 0007");
    expect(texto).toContain("2 × Brisa de Coco (100 ml)");
    // Formato propio (lib/moneda/formato.ts): espacio duro de miles, coma decimal.
    expect(texto).toContain("Total: 154,00 USD (≈ 50 050 CUP al cambio de hoy)");
    expect(texto).toContain("2 × Brisa de Coco (100 ml) — 94,00 USD");
    expect(texto).toContain("Pago en efectivo al recibir.");
  });

  it("sin tasa no menciona CUP; el enlace va a wa.me con el texto codificado", () => {
    const texto = textoVale({ numeroPedido: 1, cliente: "x@y.cu", lineas: [], totalUsd: 10, tasa: null, urlPedido: "u" });
    expect(texto).not.toContain("CUP");
    const enlace = enlaceWhatsApp("+53 5555 1234", "Hola & adiós");
    expect(enlace).toBe("https://wa.me/5355551234?text=Hola%20%26%20adi%C3%B3s");
  });
});
