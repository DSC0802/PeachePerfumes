"use client";

import { useSyncExternalStore } from "react";
import styles from "./ConmutadorTema.module.css";

/**
 * §13 de docs/design/componentes.md + arquitectura §7 — Selector de tema.
 * Cliente: alterna `light → dark → system`, escribe `peache-theme` en
 * `localStorage` (decisiones D-TEMA-1), aplica `dataset.theme` +
 * `style.colorScheme` y reacciona a `prefers-color-scheme` mientras la
 * preferencia sea `system`.
 *
 * La preferencia vive en una "external store" (`useSyncExternalStore`):
 * - el render del servidor es determinista (`system`, tema claro) y coincide
 *   con el HTML que produce el script anti-FOUC de `layout.tsx` (§7.2);
 * - la escritura del DOM ocurre en los manejadores de eventos (feedback
 *   inmediato, estados §4.4), nunca dentro de un efecto con `setState`.
 *
 * Sin `aria-pressed`: es "cambiar a…", no un toggle de dos estados (§13).
 */
type Preferencia = "light" | "dark" | "system";

const CLAVE = "peache-theme";
const EVENTO = "peache-theme-cambio";
const CONSULTA = "(prefers-color-scheme: dark)";

/**
 * Tres textos literales, en el orden del ciclo (decisiones D-TEMA-2):
 * cada uno anuncia la ACCIÓN que hace el botón al pulsarlo, no el tema que
 * se ve ahora — con sólo dos textos el control anunciaba «Cambiar a modo
 * claro» mientras entraba en `system` (WCAG 2.5.3).
 */
const ETIQUETAS: Record<Preferencia, string> = {
  light: "Cambiar a modo oscuro",
  dark: "Seguir el sistema",
  system: "Cambiar a modo claro",
};

let mediaSistema: MediaQueryList | null = null;

function obtenerMedia(): MediaQueryList {
  if (!mediaSistema) mediaSistema = window.matchMedia(CONSULTA);
  return mediaSistema;
}

function leerPreferencia(): Preferencia {
  const guardada = window.localStorage.getItem(CLAVE);
  return guardada === "dark" || guardada === "light" || guardada === "system"
    ? guardada
    : "system";
}

function leerSistemaOscuro(): boolean {
  return obtenerMedia().matches;
}

const servidorPreferencia = (): Preferencia => "system";
const servidorSistemaOscuro = (): boolean => false;

/** Misma escritura que el script anti-FOUC de `app/layout.tsx` (arquitectura §7.2). */
function aplicarTema(preferencia: Preferencia, sistemaOscuro: boolean): void {
  const oscuro = preferencia === "dark" || (preferencia !== "light" && sistemaOscuro);
  const raiz = document.documentElement;
  raiz.dataset.theme = oscuro ? "dark" : "light";
  raiz.style.colorScheme = oscuro ? "dark" : "light";
}

function suscribir(alCambiar: () => void): () => void {
  const media = obtenerMedia();
  const notificar = () => {
    // Cambio externo (sistema operativo u otra pestaña): el DOM se
    // sincroniza aquí, fuera del render; la store notifica a React.
    aplicarTema(leerPreferencia(), obtenerMedia().matches);
    alCambiar();
  };
  media.addEventListener("change", notificar);
  window.addEventListener("storage", notificar);
  window.addEventListener(EVENTO, notificar);
  return () => {
    media.removeEventListener("change", notificar);
    window.removeEventListener("storage", notificar);
    window.removeEventListener(EVENTO, notificar);
  };
}

export default function ConmutadorTema() {
  const preferencia = useSyncExternalStore(suscribir, leerPreferencia, servidorPreferencia);
  const sistemaOscuro = useSyncExternalStore(suscribir, leerSistemaOscuro, servidorSistemaOscuro);

  const alternar = () => {
    // Ciclo `light → dark → system` (D-TEMA-2); el valor se guarda tal cual,
    // también `system` (componentes.md §13.2).
    const siguiente: Preferencia =
      preferencia === "light" ? "dark" : preferencia === "dark" ? "system" : "light";

    window.localStorage.setItem(CLAVE, siguiente);

    aplicarTema(siguiente, obtenerMedia().matches); // feedback inmediato, sin toast (§4.4)
    window.dispatchEvent(new Event(EVENTO)); // la store re-renderiza con el nuevo valor
  };

  // Tema efectivo visible en pantalla (para el icono: sol en oscuro, luna en claro, §13)
  const oscuroVisible = preferencia === "dark" || (preferencia === "system" && sistemaOscuro);
  const etiqueta = ETIQUETAS[preferencia];

  return (
    <button
      type="button"
      className={styles.tema}
      onClick={alternar}
      aria-label={etiqueta}
      title={etiqueta}
    >
      {oscuroVisible ? (
        // sol (modo oscuro)
        <svg className={styles.icono} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.9 3.9l1.4 1.4M14.7 14.7l1.4 1.4M16.1 3.9l-1.4 1.4M5.3 14.7l-1.4 1.4" />
          </g>
        </svg>
      ) : (
        // luna (modo claro)
        <svg className={styles.icono} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
