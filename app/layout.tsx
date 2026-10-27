import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Cabecera from "@/components/layout/Cabecera";
import PiePagina from "@/components/layout/PiePagina";
import AvisoDemostracion from "@/components/landing/AvisoDemostracion";
import { CarritoProveedor } from "@/components/carrito/CarritoContexto";

/**
 * Arquitectura §7.2 — script anti-FOUC síncrono en `<head>`: se ejecuta antes
 * del primer pintado y evita el parpadeo de tema. Clave `peache-theme` con
 * valores `dark` | `light` | `system` (decisiones D-TEMA-1). Sólo si no hay
 * JS previo, el modo claro es el fallback (identidad §10).
 * Copiado literalmente de `docs/arquitectura.md` §7.2 — no reescribir.
 */
const scriptTema = `(function(){try{
  var g=localStorage.getItem("peache-theme");
  if(g!=="dark"&&g!=="light"&&g!=="system") g="system";
  var oscuro = g==="dark" || (g!=="light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  var el=document.documentElement;
  el.dataset.theme = oscuro ? "dark" : "light";
  el.style.colorScheme = oscuro ? "dark" : "light";
}catch(e){}})();`;

export const metadata: Metadata = {
  // Sin dominio de producción en Fase 1 (decisión D4 pendiente, arquitectura §12)
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Peache Perfumes",
    template: "%s · Peache Perfumes",
  },
  description: "Perfumes seleccionados con cuidado. Catálogo de perfumería Peache Perfumes.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
        <CarritoProveedor>
          {/* Enlace de salto: primer foco de la página (§3 de componentes.md) */}
          <a href="#contenido" className="saltar-al-contenido">
            Saltar al contenido
          </a>
          <Cabecera />
        {/* R3 (decisión del PM): aviso de datos de demostración visible en todo
            el sitio; vive aquí (una sola copia, sin duplicar) y la portada ya
            no lo renderiza. */}
        <AvisoDemostracion />
        <main id="contenido" tabIndex={-1}>
          {children}
        </main>
        <PiePagina />
        </CarritoProveedor>
      </body>
    </html>
  );
}
