import type { FamiliaOlfativa } from "@/lib/catalogo";

/**
 * Nombres visibles de las familias olfativas (estados §2.1: «Floral»,
 * «Cítrico»…), en el orden del ejemplo de ese documento. El tipo
 * `FamiliaOlfativa` vive en `lib/catalogo` (decisiones D-DATOS-1); esta
 * lista sólo aporta el rótulo para los enlaces de portada y el meta de la
 * tarjeta. Si `lib/catalogo` exporta algún día la lista canónica, este
 * archivo se reduce a re-exportarla.
 */
export const FAMILIAS: readonly { slug: FamiliaOlfativa; nombre: string }[] = [
  { slug: "floral", nombre: "Floral" },
  { slug: "amaderado", nombre: "Amaderado" },
  { slug: "citrico", nombre: "Cítrico" },
  { slug: "oriental", nombre: "Oriental" },
  { slug: "frutal", nombre: "Frutal" },
  { slug: "acuatico", nombre: "Acuático" },
  { slug: "gourmand", nombre: "Gourmand" },
];

/** Rótulo de familia para el meta de la tarjeta (§7: «Floral · 100 ml»). */
export function nombreFamilia(familia: FamiliaOlfativa): string {
  return FAMILIAS.find((f) => f.slug === familia)?.nombre ?? familia;
}
