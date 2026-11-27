/**
 * Métricas del panel (F3-C) — funciones PURAS sobre los datos ya leídos.
 * El catálogo es pequeño (decenas de filas): agregar en memoria evita SQL
 * duplicado y deja todo testeable sin BD. Sin pedidos todavía (F3-D):
 * aquí no hay ninguna cifra de ventas.
 */
import type { Categoria, FamiliaOlfativa } from "@/lib/catalogo/tipos";
import {
  ESTADOS_PRODUCTO,
  FAMILIAS,
  UMBRAL_STOCK_BAJO,
  type ClienteAdmin,
  type EstadoProducto,
  type ProductoAdmin,
} from "./tipos";

export interface Serie {
  etiqueta: string;
  valor: number;
}

export const NOMBRE_FAMILIA: Record<FamiliaOlfativa, string> = {
  citrico: "Cítrico",
  floral: "Floral",
  amaderado: "Amaderado",
  oriental: "Oriental",
  frutal: "Frutal",
  acuatico: "Acuático",
  gourmand: "Gourmand",
};

export const NOMBRE_ESTADO: Record<EstadoProducto, string> = {
  activo: "Activo",
  agotado: "Agotado",
  descontinuado: "Descontinuado",
};

export const RANGOS_PRECIO = [
  { etiqueta: "Menos de 50 USD", min: 0, max: 50 },
  { etiqueta: "50–99 USD", min: 50, max: 100 },
  { etiqueta: "100–149 USD", min: 100, max: 150 },
  { etiqueta: "150 USD o más", min: 150, max: Infinity },
] as const;

export function valorInventario(p: Pick<ProductoAdmin, "precioUsd" | "stock">): number {
  return Math.round(p.precioUsd * p.stock * 100) / 100;
}

/** Sólo cuenta lo que está a la venta: visibles y no descontinuados. */
export function enCatalogo(p: ProductoAdmin): boolean {
  return !p.oculto && p.estado !== "descontinuado";
}

export function porcentaje(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100);
}

/** Lunes 00:00 UTC de la semana de `fecha`. */
export function inicioSemana(fecha: Date): Date {
  const d = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const dia = (d.getUTCDay() + 6) % 7; // lunes = 0
  d.setUTCDate(d.getUTCDate() - dia);
  return d;
}

/** Altas por semana en las últimas `semanas` (incluida la actual), de más antigua a más reciente. */
export function altasPorSemana(fechas: Date[], ahora: Date, semanas = 8): Serie[] {
  const actual = inicioSemana(ahora).getTime();
  const SEMANA = 7 * 24 * 60 * 60 * 1000;
  const cubos = Array.from({ length: semanas }, (_, i) => actual - (semanas - 1 - i) * SEMANA);
  const cuenta = new Map<number, number>(cubos.map((c) => [c, 0]));
  for (const fecha of fechas) {
    const clave = inicioSemana(fecha).getTime();
    if (cuenta.has(clave)) cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
  }
  return cubos.map((c) => {
    const d = new Date(c);
    const etiqueta = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { etiqueta, valor: cuenta.get(c) ?? 0 };
  });
}

export interface ResumenPanel {
  totalProductos: number;
  enCatalogo: number;
  ocultos: number;
  valorInventarioUsd: number;
  unidadesEnStock: number;
  stockBajo: ProductoAdmin[];
  sinStock: number;
  clientes: number;
  porCategoria: Serie[];
  porFamilia: Serie[];
  porEstado: Serie[];
  porRangoPrecio: Serie[];
  valorPorCategoria: Serie[];
  topValor: { producto: ProductoAdmin; valor: number }[];
  altasSemanales: Serie[];
}

export function calcularResumen(
  productos: ProductoAdmin[],
  categorias: Categoria[],
  clientes: ClienteAdmin[],
  ahora: Date = new Date(),
): ResumenPanel {
  const vendibles = productos.filter(enCatalogo);
  const contar = <T>(lista: T[], pred: (x: T) => boolean) => lista.filter(pred).length;

  const topValor = vendibles
    .map((producto) => ({ producto, valor: valorInventario(producto) }))
    .sort((a, b) => b.valor - a.valor || a.producto.nombre.localeCompare(b.producto.nombre, "es"))
    .slice(0, 5);

  const soloClientes = clientes.filter((c) => c.rol === "cliente");

  return {
    totalProductos: productos.length,
    enCatalogo: vendibles.length,
    ocultos: contar(productos, (p) => p.oculto),
    valorInventarioUsd:
      Math.round(vendibles.reduce((suma, p) => suma + valorInventario(p), 0) * 100) / 100,
    unidadesEnStock: vendibles.reduce((suma, p) => suma + p.stock, 0),
    stockBajo: vendibles
      .filter((p) => p.stock <= UMBRAL_STOCK_BAJO)
      .sort((a, b) => a.stock - b.stock || a.nombre.localeCompare(b.nombre, "es")),
    sinStock: contar(vendibles, (p) => p.stock === 0),
    clientes: soloClientes.length,
    porCategoria: categorias.map((c) => ({
      etiqueta: c.nombre,
      valor: contar(vendibles, (p) => p.categoriaId === c.id),
    })),
    porFamilia: FAMILIAS.map((f) => ({
      etiqueta: NOMBRE_FAMILIA[f],
      valor: contar(vendibles, (p) => p.familia === f),
    })),
    porEstado: ESTADOS_PRODUCTO.map((e) => ({
      etiqueta: NOMBRE_ESTADO[e],
      valor: contar(productos, (p) => !p.oculto && p.estado === e),
    })),
    porRangoPrecio: RANGOS_PRECIO.map((r) => ({
      etiqueta: r.etiqueta,
      valor: contar(vendibles, (p) => p.precioUsd >= r.min && p.precioUsd < r.max),
    })),
    valorPorCategoria: categorias.map((c) => ({
      etiqueta: c.nombre,
      valor:
        Math.round(
          vendibles
            .filter((p) => p.categoriaId === c.id)
            .reduce((s, p) => s + valorInventario(p), 0) * 100,
        ) / 100,
    })),
    topValor,
    altasSemanales: altasPorSemana(
      soloClientes.map((c) => c.creadoEn),
      ahora,
    ),
  };
}

/** CSV (RFC 4180, separador «;» para Excel en español) del inventario completo. */
export function inventarioCsv(productos: ProductoAdmin[], categorias: Categoria[]): string {
  const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]));
  const celda = (v: string | number | boolean) => {
    let s = String(v);
    // Evita inyección de fórmulas al abrirlo en Excel/LibreOffice.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const cabecera = ["slug", "marca", "nombre", "categoria", "familia", "ml", "precio_usd", "stock", "valor_usd", "estado", "oculto"];
  const filas = productos.map((p) => [
    p.slug,
    p.marca,
    p.nombre,
    nombreCategoria.get(p.categoriaId) ?? p.categoriaId,
    NOMBRE_FAMILIA[p.familia],
    p.tamanoMl,
    p.precioUsd.toFixed(2),
    p.stock,
    valorInventario(p).toFixed(2),
    NOMBRE_ESTADO[p.estado],
    p.oculto ? "sí" : "no",
  ]);
  return "﻿" + [cabecera, ...filas].map((f) => f.map(celda).join(";")).join("\r\n") + "\r\n";
}
