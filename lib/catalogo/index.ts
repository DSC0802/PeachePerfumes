import type { CatalogoRepositorio } from "./repositorio";
import { repositorioDemo } from "./repositorio-demo";

export * from "./tipos";
export type { CatalogoRepositorio };

/**
 * Fase 2: demo. Fase 3+: cambiar por `repositorioApi` (mismo tipo), sin tocar
 * la UI (docs/api-contracto.md §6.1). Este es el ÚNICO punto de entrada de
 * `app/` y `components/` hacia los datos del catálogo.
 */
export const catalogo: CatalogoRepositorio = repositorioDemo;
