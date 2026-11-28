import Cabecera from "@/components/layout/Cabecera";
import type { CuentaCabecera } from "@/components/layout/CuentaAcciones";
import { obtenerSesionActual } from "@/lib/auth/acceso";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PiePagina from "@/components/layout/PiePagina";
import { CarritoProveedor } from "@/components/carrito/CarritoContexto";
import { MonedaProveedor } from "@/components/moneda/MonedaContexto";
import { cookies } from "next/headers";
import { leerPreferencia, NOMBRE_COOKIE_MONEDA } from "@/lib/moneda/conversion";
import { obtenerTasaVigente } from "@/lib/moneda/repositorio";

/* Fuentes autoalojadas — identidad visual Peache (2026-11-27).
   Mergian: logotipo y marca. Bodoni Moda y Archivo se mantienen como fallback. */
const mergian = localFont({
  src: "../identidadvisual/03 Tipografias/Mergian/Mergian Regular.otf",
  weight: "400",
  variable: "--fuente-mergian",
  display: "swap",
});

/* Fuentes OFL autoalojadas (mundo «la revista de perfumes», 2026-11-07).
   Bodoni Moda: titulares y cabecera. Archivo: texto, interfaz y cifras. */
const bodoni = localFont({
  src: "./fonts/BodoniModa-variable-latin.woff2",
  weight: "400 900",
  variable: "--fuente-bodoni",
  display: "swap",
});

const archivo = localFont({
  src: "./fonts/Archivo-variable-latin.woff2",
  weight: "100 900",
  variable: "--fuente-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }]});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Peache Perfumes",
    template: "%s · Peache Perfumes",
  },
  description: "Perfumes seleccionados con cuidado. Catálogo de perfumería Peache Perfumes.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Leer sesión para la navbar (convierte TODAS las rutas en dinámicas - esperado D-F3B-DINAMICO)
  const [usuario, tasaVigente, almacenCookies] = await Promise.all([
    obtenerSesionActual(),
    obtenerTasaVigente(),
    cookies(),
  ]);
  // F3-C2: la página llega ya en la moneda elegida (cookie) con la tasa vigente.
  const monedaInicial = leerPreferencia(almacenCookies.get(NOMBRE_COOKIE_MONEDA)?.value);
  const tasa = tasaVigente?.cupPorUsd ?? null;
  const cuenta: CuentaCabecera | null = usuario
    ? { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    : null;

  return (
    <html lang="es" suppressHydrationWarning className={`${bodoni.variable} ${archivo.variable} ${mergian.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
        <MonedaProveedor monedaInicial={monedaInicial} tasa={tasa}>
        <CarritoProveedor>
          <a href="#contenido" className="saltar-al-contenido">
            Saltar al contenido
          </a>
          <Cabecera cuenta={cuenta} />
          <main id="contenido" tabIndex={-1}>
            {children}
          </main>
          <PiePagina />
        </CarritoProveedor>
        </MonedaProveedor>
      </body>
    </html>
  );
}

const scriptTema = `(function(){try{
  var g=localStorage.getItem("peache-theme");
  if(g!=="dark"&&g!=="light"&&g!=="system") g="system";
  var oscuro = g==="dark" || (g!=="light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  var el=document.documentElement;
  el.dataset.theme = oscuro ? "dark" : "light";
  el.style.colorScheme = oscuro ? "dark" : "light";
}catch(e){}})();`;
