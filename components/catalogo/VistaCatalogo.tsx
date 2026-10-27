"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { FamiliaOlfativa, OrdenCatalogo } from "@/lib/catalogo";
import Boton from "@/components/ui/Boton";
import EstadoVacio from "@/components/ui/EstadoVacio";
import { FAMILIAS } from "@/components/landing/familias";
import Buscador from "./Buscador";
import Filtros from "./Filtros";
import SelectorOrden from "./SelectorOrden";
import TituloCatalogo from "./TituloCatalogo";
import { ORDEN_DEFECTO } from "./ordenes";
import styles from "./VistaCatalogo.module.css";

/** Estado en URL de `/catalogo` (estados §2.1): la URL es la única fuente. */
interface EstadoUrl {
  q?: string;
  familia?: FamiliaOlfativa | null;
  categoria?: string | null;
  orden?: OrdenCatalogo;
}

export interface VistaCatalogoProps {
  /** `?q=` aplicado (normalizado en la página: 2–60 caracteres). */
  q: string;
  /** `?orden=` aplicado (siempre normalizado; ver `ordenes.ts`). */
  orden: OrdenCatalogo;
  familia: FamiliaOlfativa | null;
  /** Slug de `?categoria=`. */
  categoria: string | null;
  categorias: { id: string; nombre: string }[];
  /** Resultados ya filtrados en el servidor (server component). */
  conteo: number;
  /** Rejilla de resultados (Server Component) o `null` si no hay. */
  children: ReactNode;
}

/** Espera del debounce de búsqueda: la URL no late por tecla (§2.1). */
const ESPERA_BUSQUEDA_MS = 300;

/**
 * Pantalla de `/catalogo` (estados §2): h1 → buscador → barra de resultados →
 * chips → rejilla/estado. Cliente sólo aquí: cada control escribe la URL
 * (`replace` para búsqueda, `push` para filtros y orden §2.1) y los resultados
 * los vuelve a calcular el servidor — sin estado local duplicado: los props
 * que llegan **son** el estado de la URL.
 */
export default function VistaCatalogo({
  q,
  orden,
  familia,
  categoria,
  categorias,
  conteo,
  children,
}: VistaCatalogoProps) {
  const router = useRouter();
  const [pendiente, lanzarTransicion] = useTransition();

  // Buffer de lo tecleado (no es estado de resultados: eso es `?q=`).
  const [busqueda, setBusqueda] = useState(q);
  const [qPrevia, setQPrevia] = useState(q);
  // Última `q` escrita por nosotros: si llega una `q` distinta de la URL es
  // externa (Atrás/Adelante) y hay que adoptarla en el buffer.
  const [qNuestra, setQNuestra] = useState<string | null>(null);
  const relojBusqueda = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ajuste de estado al cambiar las props (patrón de React): sólo cuando la
  // URL cambia sin que lo pidamos nosotros; si lo escribimos nosotros, el
  // buffer —que puede llevar letras adicionales tecleadas— se conserva.
  if (qPrevia !== q) {
    setQPrevia(q);
    if (q !== qNuestra) setBusqueda(q);
  }

  useEffect(
    () => () => {
      if (relojBusqueda.current) clearTimeout(relojBusqueda.current);
    },
    [],
  );

  const estadoActual: EstadoUrl = {
    q: q || undefined,
    familia,
    categoria,
    orden,
  };

  function construirUrl(siguiente: EstadoUrl): string {
    const params = new URLSearchParams();
    if (siguiente.q) params.set("q", siguiente.q);
    if (siguiente.categoria) params.set("categoria", siguiente.categoria);
    if (siguiente.familia) params.set("familia", siguiente.familia);
    // El orden por defecto se omiten para URLs limpias: ausente ≡ ORDEN_DEFECTO.
    if (siguiente.orden && siguiente.orden !== ORDEN_DEFECTO) {
      params.set("orden", siguiente.orden);
    }
    const consulta = params.toString();
    return consulta ? `/catalogo?${consulta}` : "/catalogo";
  }

  function navegar(siguiente: EstadoUrl, metodo: "push" | "replace") {
    const href = construirUrl(siguiente);
    // Transición: la rejilla actual se mantiene visible y `scroll: false`
    // replica el comportamiento del `history.pushState`/`replaceState` de §2.1
    // (sin salto de scroll; el foco del chip pulsado se conserva).
    lanzarTransicion(() => {
      if (metodo === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    });
  }

  /** §2.2: al limpiar, el foco va al campo de búsqueda. */
  function fochearBusqueda() {
    document.getElementById("q")?.focus();
  }

  function alternarFamilia(id: string) {
    // Los ids vienen de FAMILIAS: slugs tipados de FamiliaOlfativa.
    const siguiente = familia === id ? null : (id as FamiliaOlfativa);
    navegar({ ...estadoActual, familia: siguiente }, "push");
  }

  function alternarCategoria(id: string) {
    const siguiente = categoria === id ? null : id;
    navegar({ ...estadoActual, categoria: siguiente }, "push");
  }

  function cambiarOrden(siguiente: OrdenCatalogo) {
    navegar({ ...estadoActual, orden: siguiente }, "push");
  }

  function limpiarFiltros(llevaFocoAlBuscador: boolean) {
    navegar({ ...estadoActual, familia: null, categoria: null }, "push");
    if (llevaFocoAlBuscador) fochearBusqueda();
  }

  function limpiarBusqueda() {
    if (relojBusqueda.current) clearTimeout(relojBusqueda.current);
    setBusqueda("");
    setQNuestra(null);
    navegar({ ...estadoActual, q: undefined }, "replace");
    fochearBusqueda();
  }

  function limpiarBusquedaYFiltros() {
    if (relojBusqueda.current) clearTimeout(relojBusqueda.current);
    setBusqueda("");
    setQNuestra(null);
    navegar(
      { ...estadoActual, q: undefined, familia: null, categoria: null },
      "push",
    );
    fochearBusqueda();
  }

  function escribirBusqueda(texto: string) {
    setBusqueda(texto);
    if (relojBusqueda.current) clearTimeout(relojBusqueda.current);
    const limpio = texto.trim();
    // 1 carácter: error junto al campo (§4.3), sin tocar la URL
    // (api-contracto §2.3: q de 2–60).
    if (limpio.length === 1) return;
    relojBusqueda.current = setTimeout(() => {
      relojBusqueda.current = null;
      if (limpio === q) return;
      const siguiente = limpio.length > 0 ? limpio : undefined;
      setQNuestra(siguiente ?? null);
      // Búsqueda: `replace` (§2.1, no llena el historial).
      navegar({ ...estadoActual, q: siguiente }, "replace");
    }, ESPERA_BUSQUEDA_MS);
  }

  const hayQ = q.length > 0;
  const hayFiltros = familia !== null || categoria !== null;
  const errorBusqueda =
    busqueda.trim().length === 1
      ? "Escribe al menos 2 letras para buscar."
      : undefined;

  const chipsFamilias = FAMILIAS.map((entrada) => ({
    id: entrada.slug,
    nombre: entrada.nombre,
  }));

  function pintarEstadoVacio(): ReactNode {
    if (!hayQ && !hayFiltros) {
      return (
        <EstadoVacio
          titulo="El catálogo está vacío"
          apoyo="Cuando publiquemos los primeros perfumes, aparecerán aquí."
        />
      );
    }
    if (hayQ && !hayFiltros) {
      return (
        <EstadoVacio
          titulo={`No encontramos perfumes para «${q}».`}
          variante="inline"
        >
          <Boton variante="terciario" onClick={limpiarBusqueda}>
            Limpiar búsqueda
          </Boton>
        </EstadoVacio>
      );
    }
    if (!hayQ && hayFiltros) {
      return (
        <EstadoVacio
          titulo="Ningún perfume coincide con los filtros seleccionados."
          variante="inline"
        >
          <Boton variante="terciario" onClick={() => limpiarFiltros(true)}>
            Quitar filtros
          </Boton>
        </EstadoVacio>
      );
    }
    return (
      <EstadoVacio
        titulo={`No encontramos perfumes para «${q}» con los filtros aplicados.`}
        variante="inline"
      >
        <Boton variante="terciario" onClick={limpiarBusquedaYFiltros}>
          Limpiar búsqueda y filtros
        </Boton>
      </EstadoVacio>
    );
  }

  return (
    <div className={styles.vista}>
      <TituloCatalogo />

      <Buscador
        valor={busqueda}
        onCambio={escribirBusqueda}
        ayuda={errorBusqueda ? undefined : "Escribe al menos 2 letras."}
        error={errorBusqueda}
      />

      {/* Barra de resultados (§2.1.3): conteo `aria-live` + «Ordenar» */}
      <div className={styles.barra}>
        <p className={styles.conteo} aria-live="polite" aria-atomic="true">
          {conteo === 1 ? "1 perfume" : `${conteo} perfumes`}
        </p>
        <SelectorOrden valor={orden} onChange={cambiarOrden} />
      </div>

      <Filtros
        familias={chipsFamilias}
        familiasActivas={familia ? [familia] : []}
        categorias={categorias}
        categoriasActivas={categoria ? [categoria] : []}
        onToggleFamilia={alternarFamilia}
        onToggleCategoria={alternarCategoria}
        onLimpiar={limpiarFiltros}
        totalResultados={conteo}
      />

      {/* Fuera del `aria-busy` (§11): si no, el aviso live se difiere hasta
          terminar y el usuario no oye «Cargando…» (§4.1). */}
      {pendiente ? (
        <p className="solo-lectura" role="status">
          Cargando…
        </p>
      ) : null}

      <div className={styles.resultados} aria-busy={pendiente || undefined}>
        {conteo > 0 ? children : pintarEstadoVacio()}
      </div>
    </div>
  );
}
