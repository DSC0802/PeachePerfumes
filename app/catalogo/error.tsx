"use client";

import Boton from "@/components/ui/Boton";
import Contenedor from "@/components/ui/Contenedor";
import EstadoVacio from "@/components/ui/EstadoVacio";
import TituloCatalogo from "@/components/catalogo/TituloCatalogo";
import styles from "@/components/catalogo/VistaCatalogo.module.css";

/**
 * Error de `/catalogo` (estados §2.2 «Error de red» + §4.3): un error de
 * sección no sustituye a la página — cabecera, `h1` y pie siguen fuera de
 * este límite— y «Reintentar» rehace el render sin recargar (`reset()`).
 * En Fase 2 el repositorio no falla (api-contracto §6.3: «error de red:
 * imposible»); el estado existe como red de seguridad y para el salto a API.
 */
export default function ErrorCatalogo({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Contenedor>
      <div className={styles.vista}>
        <TituloCatalogo />
        <EstadoVacio
          titulo="No pudimos cargar el catálogo."
          apoyo="Revisa tu conexión e inténtalo de nuevo."
        >
          <Boton variante="secundario" onClick={reset}>
            Reintentar
          </Boton>
        </EstadoVacio>
      </div>
    </Contenedor>
  );
}
