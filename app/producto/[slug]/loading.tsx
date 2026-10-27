"use client";

import { useEffect, useState } from "react";
import Contenedor from "@/components/ui/Contenedor";
import SkeletonFicha from "@/components/producto/SkeletonFicha";

/**
 * Carga de `/producto/[slug]` (estados §3.2 «Carga»: skeleton de ficha con
 * media `1/1`, `h1`, líneas y bloque de precio — misma caja final, cero CLS).
 * §1 de `estados-y-responsividad.md`: por debajo de 200 ms NO se pinta
 * skeleton (parpadea más de lo que ayuda); pasado ese umbral sí, con
 * `aria-busy` en la región y «Cargando…» `sr-only` (§11, §4.1).
 */
export default function CargandoFichaProducto() {
  const [umbral, setUmbral] = useState(false);

  useEffect(() => {
    const reloj = setTimeout(() => setUmbral(true), 200);
    return () => clearTimeout(reloj);
  }, []);

  if (!umbral) return null;

  return (
    <Contenedor>
      {/* Fuera del `aria-busy` (§11): si no, el aviso live se difiere */}
      <p className="solo-lectura" role="status">
        Cargando…
      </p>
      <div aria-busy="true">
        <SkeletonFicha />
      </div>
    </Contenedor>
  );
}
