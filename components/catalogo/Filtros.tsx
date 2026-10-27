"use client";

import { useState } from "react";
import Boton from "@/components/ui/Boton";
import HojaModal from "@/components/ui/HojaModal";
import styles from "./Filtros.module.css";

/**
 * Opción de chip: familia olfativa o categoría. `id` es SIEMPRE el valor del
 * query param (`?familia=floral`, `?categoria=mujer`).
 */
export interface OpcionChip {
  id: string;
  nombre: string;
}

/**
 * Chips de filtro (estados §2.1 y §2.3): `<button aria-pressed>` (D-FILTROS,
 * no enlaces), inline desde 768px y dentro de la hoja de filtros por debajo,
 * con trigger "Filtros" / "Filtros · {n}".
 *
 * Dos grupos visibles: **Familia** y **Categoría** (título rótulo mínimo al
 * estilo de «Familia» ya ratificado en la hoja). «Limpiar filtros» (escritario)
 * limpia los chips y lleva el foco al buscador (§2.2); «Quitar filtros» de la
 * hoja no mueve el foco: manda §2.3 (el diálogo devuelve el foco al trigger).
 */
export interface FiltrosProps {
  familias: OpcionChip[];
  /** Familia activa (`?familia=`), si la hay. */
  familiasActivas: string[];
  categorias: OpcionChip[];
  /** Categoría activa (`?categoria=`), si la hay. */
  categoriasActivas: string[];
  onToggleFamilia: (id: string) => void;
  onToggleCategoria: (id: string) => void;
  /** Limpia los chips; `llevaFocoAlBuscador` = accionado desde escritorio. */
  onLimpiar: (llevaFocoAlBuscador: boolean) => void;
  /** Conteo para "Ver {n} perfumes" (pie de la hoja). */
  totalResultados: number;
  className?: string;
}

export default function Filtros({
  familias,
  familiasActivas,
  categorias,
  categoriasActivas,
  onToggleFamilia,
  onToggleCategoria,
  onLimpiar,
  totalResultados,
  className,
}: FiltrosProps) {
  const [abierto, setAbierto] = useState(false);
  const hayActivos = familiasActivas.length > 0 || categoriasActivas.length > 0;
  const conteo = familiasActivas.length + categoriasActivas.length;
  const etiquetaTrigger = conteo > 0 ? `Filtros · ${conteo}` : "Filtros";
  const plural = totalResultados === 1 ? "perfume" : "perfumes";
  const clases = className ? `${styles.filtros} ${className}` : styles.filtros;

  const pintarChip = (
    opcion: OpcionChip,
    activa: boolean,
    alPulsar: (id: string) => void,
  ) => (
    <button
      key={opcion.id}
      type="button"
      className={activa ? `${styles.chip} ${styles["chip--activa"]}` : styles.chip}
      aria-pressed={activa}
      onClick={() => alPulsar(opcion.id)}
    >
      {opcion.nombre}
    </button>
  );

  const chipsFamilias = (
    <div className={styles.chips}>
      {familias.map((familia) =>
        pintarChip(familia, familiasActivas.includes(familia.id), onToggleFamilia),
      )}
    </div>
  );

  const chipsCategorias = (
    <div className={styles.chips}>
      {categorias.map((categoria) =>
        pintarChip(
          categoria,
          categoriasActivas.includes(categoria.id),
          onToggleCategoria,
        ),
      )}
    </div>
  );

  return (
    <div className={clases}>
      {/* ≥768px: grupos de chips inline (§2.1) */}
      <div className={styles.escritorio}>
        <div className={styles.grupo} role="group" aria-labelledby="chips-familia">
          <p className={styles.grupoTitulo} id="chips-familia">
            Familia
          </p>
          {chipsFamilias}
        </div>
        <div className={styles.grupo} role="group" aria-labelledby="chips-categoria">
          <p className={styles.grupoTitulo} id="chips-categoria">
            Categoría
          </p>
          {chipsCategorias}
        </div>
        {hayActivos ? (
          <div className={styles.limpiar}>
            <Boton variante="terciario" onClick={() => onLimpiar(true)}>
              Limpiar filtros
            </Boton>
          </div>
        ) : null}
      </div>

      {/* <768px: trigger con contador (§2.3) */}
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={abierto}
        aria-controls="filtros-panel"
        onClick={() => setAbierto(true)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M2 4h12M4 8h8M6.5 12h3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {etiquetaTrigger}
      </button>

      <HojaModal
        id="filtros-panel"
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Filtros"
        etiquetaCerrar="Cerrar filtros"
        variante="inferior"
        pie={
          <>
            <Boton variante="secundario" onClick={() => onLimpiar(false)}>
              Quitar filtros
            </Boton>
            <Boton variante="primario" onClick={() => setAbierto(false)}>
              <span aria-live="polite">
                {`Ver ${totalResultados} ${plural}`}
              </span>
            </Boton>
          </>
        }
      >
        <div className={styles.grupo} role="group" aria-labelledby="hoja-chips-familia">
          <p className={styles.grupoTitulo} id="hoja-chips-familia">
            Familia
          </p>
          {chipsFamilias}
        </div>
        <div className={styles.grupo} role="group" aria-labelledby="hoja-chips-categoria">
          <p className={styles.grupoTitulo} id="hoja-chips-categoria">
            Categoría
          </p>
          {chipsCategorias}
        </div>
      </HojaModal>
    </div>
  );
}
