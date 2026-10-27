"use client";

import { useEffect, useState } from "react";
import Contenedor from "@/components/ui/Contenedor";
import RejillaCatalogo from "@/components/catalogo/RejillaCatalogo";
import SkeletonTarjeta from "@/components/catalogo/SkeletonTarjeta";
import TituloCatalogo from "@/components/catalogo/TituloCatalogo";
import styles from "@/components/catalogo/VistaCatalogo.module.css";

/** Tarjetas del skeleton: 8, dentro del presupuesto 4–8 de §3.1/§11. */
const TARJETAS_SKELETON = 8;

/**
 * Carga de `/catalogo` (estados §2.2 «Carga → Skeleton de rejilla»).
 * §1 de `estados-y-responsividad.md`: por debajo de 200 ms NO se pinta
 * skeleton (parpadea más de lo que ayuda); pasado ese umbral sí, con
 * `aria-busy` en la región y «Cargando…» `sr-only` (§11, §4.1).
 * El `h1` nunca desaparece (§3.1: «la sección nunca se oculta entera»).
 */
export default function CargandoCatalogo() {
  const [umbral, setUmbral] = useState(false);

  useEffect(() => {
    const reloj = setTimeout(() => setUmbral(true), 200);
    return () => clearTimeout(reloj);
  }, []);

  if (!umbral) return null;

  return (
    <Contenedor>
      <div className={styles.vista}>
        <TituloCatalogo />
        <p className="solo-lectura" role="status">
          Cargando…
        </p>
        <div className={styles.resultados} aria-busy="true">
          <RejillaCatalogo>
            {Array.from({ length: TARJETAS_SKELETON }, (_, indice) => (
              <SkeletonTarjeta key={indice} />
            ))}
          </RejillaCatalogo>
        </div>
      </div>
    </Contenedor>
  );
}
