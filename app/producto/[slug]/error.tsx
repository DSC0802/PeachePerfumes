"use client";

import Boton from "@/components/ui/Boton";
import Contenedor from "@/components/ui/Contenedor";
import EstadoVacio from "@/components/ui/EstadoVacio";

/**
 * Error de la ficha (estados §3.2 «Error de red» + §4.3 «Error en la ficha»):
 * microcopy literal «No pudimos cargar este perfume.» + «Reintentar», que
 * rehace el render sin recargar la página (`reset()`). Un error de sección no
 * sustituye a la página: cabecera y pie siguen fuera de este límite. En Fase 2
 * el repositorio no falla (api-contracto §6.3: «error de red: imposible»); el
 * estado existe como red de seguridad y para el salto a API (§5.3).
 * El `h1` de la ficha (el nombre) no puede saberse sin datos, así que el
 * título del estado es el `h1` de esta pantalla: se mantiene un único `h1`.
 */
export default function ErrorFichaProducto({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Contenedor>
      <EstadoVacio
        nivelTitulo="h1"
        titulo="No pudimos cargar este perfume."
        apoyo="Revisa tu conexión e inténtalo de nuevo."
      >
        <Boton variante="secundario" onClick={reset}>
          Reintentar
        </Boton>
      </EstadoVacio>
    </Contenedor>
  );
}
