"use client";

import type { ChangeEvent } from "react";
import CampoTexto from "@/components/ui/CampoTexto";
import styles from "./Buscador.module.css";

/**
 * Buscador del catálogo (estados §2.1.2): `type="search"`, label "Buscar",
 * placeholder "Nombre del perfume" (§4.5) y `maxLength` 60 (`api-contracto`
 * §2.3: `q` de 2–60 caracteres).
 *
 * **Controlado**: el valor lo guarda el panel, que escribe `?q=` en la URL
 * (la URL es el único estado de resultados; el buffer es sólo lo tecleado).
 * El foco al limpiar va a este input por su id `q` (estados §2.2).
 */
export interface BuscadorProps {
  valor: string;
  onCambio: (valor: string) => void;
  /** Ayuda persistente o mensaje de error junto al campo (§2 de `componentes.md`). */
  ayuda?: string;
  error?: string;
  className?: string;
}

export default function Buscador({
  valor,
  onCambio,
  ayuda,
  error,
  className,
}: BuscadorProps) {
  const manejarCambio = (evento: ChangeEvent<HTMLInputElement>) =>
    onCambio(evento.target.value);
  const clases = className ? `${styles.buscador} ${className}` : styles.buscador;

  return (
    <div className={clases}>
      <CampoTexto
        id="q"
        name="q"
        etiqueta="Buscar"
        tipo="search"
        placeholder="Nombre del perfume"
        autoComplete="off"
        maxLength={60}
        value={valor}
        onChange={manejarCambio}
        ayuda={ayuda}
        error={error}
      />
    </div>
  );
}
