"use client";

import Boton from "@/components/ui/Boton";
import Contenedor from "@/components/ui/Contenedor";
import EstadoVacio from "@/components/ui/EstadoVacio";

/**
 * Error de la raíz (spec F3-A §7): red de seguridad para `/` (landing, que
 * lee catálogo) y para toda ruta sin su propio error.tsx. Igual patrón que
 * `app/catalogo/error.tsx`: `reset()` rehace el render sin recargar y no hay
 * fallback a datos demo — un fallo de BD se muestra, no se maquilla.
 * `nivelTitulo="h1"`: a diferencia del catálogo (donde `TituloCatalogo`
 * aporta el h1), la raíz no tiene ningún encabezado de nivel 1 propio.
 */
export default function ErrorRaiz({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Contenedor>
      <EstadoVacio
        nivelTitulo="h1"
        titulo="No pudimos cargar la página."
        apoyo="Revisa tu conexión e inténtalo de nuevo."
      >
        <Boton variante="secundario" onClick={reset}>
          Reintentar
        </Boton>
      </EstadoVacio>
    </Contenedor>
  );
}
