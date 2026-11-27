/**
 * Validación PURA del formulario de producto (F3-C). Sin BD ni next:
 * la unicidad del slug la comprueba el repositorio.
 */
import type { FamiliaOlfativa } from "@/lib/catalogo/tipos";
import {
  ESTADOS_PRODUCTO,
  FAMILIAS,
  type CampoProducto,
  type EntradaProducto,
  type EstadoProducto,
} from "./tipos";

/** «Brisa de Coco» → «brisa-de-coco» (sin tildes, sólo [a-z0-9-]). */
export function generarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const PATRON_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** «bergamota, limón ,, pomelo» → ["bergamota", "limón", "pomelo"]. */
export function separarNotas(texto: string): string[] {
  return texto
    .split(",")
    .map((nota) => nota.trim())
    .filter(Boolean);
}

export type ResultadoValidacion =
  | { ok: true; datos: EntradaProducto }
  | { ok: false; errores: Partial<Record<CampoProducto, string>> };

/** Lee y valida los campos de texto del formulario (la imagen va aparte). */
export function validarProducto(
  campos: Record<string, string | undefined>,
  categoriasValidas: readonly string[],
): ResultadoValidacion {
  const errores: Partial<Record<CampoProducto, string>> = {};
  const texto = (clave: string) => (campos[clave] ?? "").trim();

  const nombre = texto("nombre");
  if (!nombre) errores.nombre = "Escribe el nombre del perfume.";
  else if (nombre.length > 120) errores.nombre = "Máximo 120 caracteres.";

  const marca = texto("marca");
  if (!marca) errores.marca = "Escribe la marca.";
  else if (marca.length > 80) errores.marca = "Máximo 80 caracteres.";

  const slug = texto("slug") || generarSlug(nombre);
  if (!slug || !PATRON_SLUG.test(slug)) {
    errores.slug = "Usa sólo minúsculas, números y guiones (p. ej. brisa-de-coco).";
  }

  const precioTexto = texto("precioUsd").replace(",", ".");
  const precioUsd = Number(precioTexto);
  if (!precioTexto || !Number.isFinite(precioUsd) || precioUsd <= 0) {
    errores.precioUsd = "Indica un precio mayor que 0.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(precioTexto)) {
    errores.precioUsd = "Máximo 2 decimales (p. ej. 49.90).";
  } else if (precioUsd >= 100_000_000) {
    errores.precioUsd = "El precio es demasiado alto.";
  }

  const tamanoTexto = texto("tamanoMl");
  const tamanoMl = Number(tamanoTexto);
  if (!/^\d+$/.test(tamanoTexto) || tamanoMl < 1 || tamanoMl > 5000) {
    errores.tamanoMl = "Indica los ml como número entero (1–5000).";
  }

  const stockTexto = texto("stock");
  const stock = Number(stockTexto);
  if (!/^\d+$/.test(stockTexto) || stock > 1_000_000) {
    errores.stock = "Indica el stock como número entero (0 o más).";
  }

  const categoriaId = texto("categoriaId");
  if (!categoriasValidas.includes(categoriaId)) {
    errores.categoriaId = "Elige una categoría.";
  }

  const familia = texto("familia") as FamiliaOlfativa;
  if (!FAMILIAS.includes(familia)) errores.familia = "Elige una familia olfativa.";

  const estado = texto("estado") as EstadoProducto;
  if (!ESTADOS_PRODUCTO.includes(estado)) errores.estado = "Elige un estado.";

  const descripcion = texto("descripcion");
  if (!descripcion) errores.descripcion = "Escribe una descripción breve.";
  else if (descripcion.length > 2000) errores.descripcion = "Máximo 2000 caracteres.";

  const notasSalida = separarNotas(texto("notasSalida"));
  const notasCorazon = separarNotas(texto("notasCorazon"));
  const notasFondo = separarNotas(texto("notasFondo"));
  if (notasSalida.length + notasCorazon.length + notasFondo.length === 0) {
    errores.notasSalida = "Añade al menos una nota olfativa.";
  }

  const imagenAlt = texto("imagenAlt");
  if (imagenAlt.length > 200) errores.imagenAlt = "Máximo 200 caracteres.";

  if (Object.keys(errores).length > 0) return { ok: false, errores };

  return {
    ok: true,
    datos: {
      slug,
      marca,
      nombre,
      tamanoMl,
      precioUsd,
      descripcion,
      notasSalida,
      notasCorazon,
      notasFondo,
      imagenAlt,
      categoriaId,
      familia,
      destacado: campos.destacado === "on",
      novedad: campos.novedad === "on",
      estado,
      stock,
    },
  };
}
