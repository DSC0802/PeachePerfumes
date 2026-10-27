import type { Categoria } from "@/lib/catalogo/tipos";

/**
 * CATEGORÍAS DE DEMOSTRACIÓN — ver data/README.md.
 * Taxonomía inventada para la Fase 2 (mujer / hombre / unisex), tal como
 * prevé docs/arquitectura.md §6.2. Cambiarla sólo afecta a este archivo y a
 * `Producto.categoriaId`; el tipo `Categoria` no cambia.
 * Los ids coinciden con los slugs para que ?categoria= sea directo.
 */
export const categorias: Categoria[] = [
  {
    id: "mujer",
    slug: "mujer",
    nombre: "Mujer",
    descripcion: "Perfumes tradicionalmente destinados al público femenino.",
  },
  {
    id: "hombre",
    slug: "hombre",
    nombre: "Hombre",
    descripcion: "Perfumes tradicionalmente destinados al público masculino.",
  },
  {
    id: "unisex",
    slug: "unisex",
    nombre: "Unisex",
    descripcion: "Fragancias pensadas para cualquier persona.",
  },
];
