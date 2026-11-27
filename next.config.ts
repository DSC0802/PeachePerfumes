import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fase 2: el catálogo es estático y pequeño; sin revalidación ni ISR todavía.
  // Cuando entre la API real (docs/api-contracto.md) se revisa esta sección.
  images: {
    // No hay optimizador de imágenes configurado todavía: las fotos de producto
    // de Fase 2 son provisionales. Si se añaden dominios remotos, hacerlo aquí
    // de forma explícita (nunca `remotePatterns` abierto).
    formats: ["image/avif", "image/webp"],
  },

  // `pg` solo existe en el servidor (Node runtime). Evitar que Turbopack intente
  // bundlarlo para el cliente al importar server actions de identidad.
  serverExternalPackages: ["pg"],

  // F3-C: las fotos de producto se suben con una server action (máx. 4 MB
  // validado en lib/admin/imagenes.ts). 5 MB deja margen al multipart.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
