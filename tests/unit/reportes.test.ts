import { describe, expect, it } from "vitest";
import {
  agruparVentas,
  agrupacionPorDefecto,
  claveDia,
  lunesDe,
  masVendidos,
  resolverPeriodo,
  totales,
  ventasCsv,
  ventasDelPeriodo,
  type Venta,
} from "@/lib/reportes/agregados";

/** Suite F3-E · reportes de ventas (puro: sin BD). */

const venta = (numero: number, iso: string, totalUsd: number, unidades = 1): Venta => ({
  numero,
  entregadoEn: new Date(iso),
  totalUsd,
  unidades,
  cliente: `c${numero}@ejemplo.cu`,
});

describe("hora de Cuba", () => {
  it("una entrega a las 23:30 de Cuba cuenta ese día, no el siguiente (UTC)", () => {
    // 2026-11-06 04:30 UTC = 2026-11-05 23:30 en La Habana (UTC-5 en noviembre).
    expect(claveDia(new Date("2026-11-06T04:30:00Z"))).toBe("2026-11-05");
    expect(claveDia(new Date("2026-11-06T05:30:00Z"))).toBe("2026-11-06");
  });

  it("semanas de lunes a domingo", () => {
    expect(lunesDe("2026-11-05")).toBe("2026-11-02"); // jueves → lunes
    expect(lunesDe("2026-11-08")).toBe("2026-11-02"); // domingo → mismo lunes
    expect(lunesDe("2026-11-09")).toBe("2026-11-09");
  });
});

describe("períodos", () => {
  const ahora = new Date("2026-11-05T15:00:00Z");
  it("predefinidos", () => {
    expect(resolverPeriodo({ periodo: "7d" }, ahora)).toEqual({ clave: "7d", desde: "2026-10-30", hasta: "2026-11-05" });
    expect(resolverPeriodo({ periodo: "mes" }, ahora)).toEqual({ clave: "mes", desde: "2026-11-01", hasta: "2026-11-05" });
    expect(resolverPeriodo({ periodo: "mes-anterior" }, ahora)).toEqual({
      clave: "mes-anterior",
      desde: "2026-10-01",
      hasta: "2026-10-31",
    });
    expect(resolverPeriodo({}, ahora)).toEqual({ clave: "30d", desde: "2026-10-07", hasta: "2026-11-05" });
  });

  it("personalizado ordena las fechas y valida el formato", () => {
    expect(resolverPeriodo({ periodo: "personalizado", desde: "2026-11-03", hasta: "2026-10-01" }, ahora)).toEqual({
      clave: "personalizado",
      desde: "2026-10-01",
      hasta: "2026-11-03",
    });
    expect(resolverPeriodo({ periodo: "personalizado", desde: "ayer" }, ahora).desde).toBe("2026-10-07");
  });

  it("agrupación por defecto según la duración", () => {
    expect(agrupacionPorDefecto({ clave: "30d", desde: "2026-10-07", hasta: "2026-11-05" })).toBe("dia");
    expect(agrupacionPorDefecto({ clave: "personalizado", desde: "2026-06-01", hasta: "2026-11-05" })).toBe("semana");
    expect(agrupacionPorDefecto({ clave: "personalizado", desde: "2025-01-01", hasta: "2026-11-05" })).toBe("mes");
  });
});

describe("agregados", () => {
  const periodo = { clave: "7d" as const, desde: "2026-10-30", hasta: "2026-11-05" };
  const ventas = [
    venta(1, "2026-11-01T15:00:00Z", 60, 1),
    venta(2, "2026-11-01T20:00:00Z", 94, 2),
    venta(3, "2026-11-06T04:30:00Z", 50, 1), // 23:30 del 05 en Cuba
    venta(4, "2026-10-20T15:00:00Z", 999, 9), // fuera del período
  ];

  it("cubos diarios con huecos a 0 y sólo ventas del período", () => {
    const cubos = agruparVentas(ventas, periodo, "dia");
    expect(cubos).toHaveLength(7);
    expect(cubos.find((c) => c.clave === "2026-11-01")).toMatchObject({ pedidos: 2, unidades: 3, totalUsd: 154 });
    expect(cubos.find((c) => c.clave === "2026-11-05")).toMatchObject({ pedidos: 1, totalUsd: 50 });
    expect(cubos.find((c) => c.clave === "2026-11-02")).toMatchObject({ pedidos: 0, totalUsd: 0 });
  });

  it("cubos semanales y mensuales", () => {
    const semanas = agruparVentas(ventas, periodo, "semana");
    expect(semanas.map((c) => c.clave)).toEqual(["2026-10-26", "2026-11-02"]);
    expect(semanas[0].totalUsd).toBe(154);
    const meses = agruparVentas(ventas, periodo, "mes");
    expect(meses.map((c) => [c.clave, c.etiqueta])).toEqual([
      ["2026-10", "oct 2026"],
      ["2026-11", "nov 2026"],
    ]);
  });

  it("totales y ticket medio", () => {
    expect(totales(ventasDelPeriodo(ventas, periodo))).toEqual({
      pedidos: 3,
      unidades: 4,
      totalUsd: 204,
      ticketMedioUsd: 68,
    });
    expect(totales([]).ticketMedioUsd).toBe(0);
  });

  it("más vendidos por unidades", () => {
    const top = masVendidos([
      { slug: "a", nombre: "Alba", cantidad: 1, precioUsd: 55 },
      { slug: "b", nombre: "Brisa", cantidad: 2, precioUsd: 47 },
      { slug: "a", nombre: "Alba", cantidad: 2, precioUsd: 55 },
    ]);
    expect(top).toEqual([
      { slug: "a", nombre: "Alba", unidades: 3, totalUsd: 165 },
      { slug: "b", nombre: "Brisa", unidades: 2, totalUsd: 94 },
    ]);
  });

  it("CSV con fecha de entrega en Cuba y CUP a la tasa dada", () => {
    const [cabecera, fila] = ventasCsv([venta(3, "2026-11-06T04:30:00Z", 50, 1)], 950).replace("﻿", "").split("\r\n");
    expect(cabecera).toBe("pedido;fecha_entrega;cliente;articulos;total_usd;total_cup_hoy");
    expect(fila).toBe("3;2026-11-05;c3@ejemplo.cu;1;50.00;47500");
  });
});
