/**
 * Tipos del panel admin (F3-C, spec 2026-11-05-f3c-panel-admin-design.md).
 * Puro: sin imports de BD ni de next. El contrato público de la tienda sigue
 * siendo `lib/catalogo/tipos.ts` (no expone stock ni estado).
 */
import type { FamiliaOlfativa } from "@/lib/catalogo/tipos";

export const ESTADOS_PRODUCTO = ["activo", "agotado", "descontinuado"] as const;
export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[number];

export const FAMILIAS: readonly FamiliaOlfativa[] = [
  "citrico",
  "floral",
  "amaderado",
  "oriental",
  "frutal",
  "acuatico",
  "gourmand",
];

/** Umbral de «stock bajo» (incluido). */
export const UMBRAL_STOCK_BAJO = 5;

/** Producto tal y como lo ve el panel: todo, incluidos los ocultos. */
export interface ProductoAdmin {
  id: string;
  slug: string;
  marca: string;
  nombre: string;
  tamano: string;
  tamanoMl: number;
  precioUsd: number;
  descripcion: string;
  notasSalida: string[];
  notasCorazon: string[];
  notasFondo: string[];
  imagenSrc: string;
  imagenAlt: string;
  categoriaId: string;
  familia: FamiliaOlfativa;
  destacado: boolean;
  novedad: boolean;
  estado: EstadoProducto;
  oculto: boolean;
  stock: number;
  creadoEn: Date;
  actualizadoEn: Date;
}

/** Datos validados para crear o actualizar (sin id, fechas ni imagen). */
export interface EntradaProducto {
  slug: string;
  marca: string;
  nombre: string;
  tamanoMl: number;
  precioUsd: number;
  descripcion: string;
  notasSalida: string[];
  notasCorazon: string[];
  notasFondo: string[];
  imagenAlt: string;
  categoriaId: string;
  familia: FamiliaOlfativa;
  destacado: boolean;
  novedad: boolean;
  estado: EstadoProducto;
  stock: number;
}

export type CampoProducto = keyof EntradaProducto | "imagen";

/** Estado que `useActionState` devuelve al formulario de producto. */
export interface EstadoFormularioProducto {
  errores?: Partial<Record<CampoProducto, string>>;
  /** Error general (BD caída, slug duplicado…). */
  error?: string;
  /** Valores tecleados para repintar el formulario tras un error. */
  valores?: Record<string, string>;
}

export interface ClienteAdmin {
  id: string;
  email: string;
  nombre: string | null;
  telefono: string | null;
  rol: "admin" | "cliente";
  creadoEn: Date;
}
