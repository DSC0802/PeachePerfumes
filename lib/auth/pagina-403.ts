/**
 * HTML autocontenido que devuelve proxy.ts con status 403 (spec F3-B §6).
 * No pasa por el layout de React, así que replica a mano lo mínimo de la
 * tienda: tokens de color (claro/oscuro, copiados de app/globals.css), el
 * wordmark y el tema elegido por el usuario (localStorage «peache-theme»).
 */
const DARK_TOKENS = `
      --color-bg: #16130f;
      --color-surface: #1e1a17;
      --color-surface-alt: #262119;
      --color-text: #f2eee8;
      --color-text-muted: #aba299;
      --color-border: #332e29;
      --color-accent: #e79aa8;
      --color-accent-hover: #f2afbb;
      --color-on-accent: #241a1d;
      color-scheme: dark;`;

export function pagina403(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Acceso restringido · Peache Perfumes</title>
  <script>(function(){try{
    var g=localStorage.getItem("peache-theme");
    if(g==="dark"||g==="light") document.documentElement.dataset.theme=g;
  }catch(e){}})();</script>
  <style>
    :root {
      --color-bg: #faf8f6;
      --color-surface: #ffffff;
      --color-surface-alt: #f1ede9;
      --color-text: #1b1714;
      --color-text-muted: #5c554e;
      --color-border: #e7e2dc;
      --color-accent: #b0485c;
      --color-accent-hover: #98394d;
      --color-on-accent: #ffffff;
      --radius: 4px;
      --font-serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
      --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      color-scheme: light;
    }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {${DARK_TOKENS}
      }
    }
    :root[data-theme="dark"] {${DARK_TOKENS}
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100svh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      font-family: var(--font-sans);
      font-size: 1rem;
      line-height: 1.5;
      background: var(--color-bg);
      color: var(--color-text);
    }
    main {
      width: 100%;
      max-width: 420px;
      text-align: center;
    }
    .marca {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 40px;
      color: var(--color-accent);
      line-height: 1.1;
      text-decoration: none;
      border-radius: var(--radius);
    }
    .marca-nombre {
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: 1.5rem;
      letter-spacing: -0.01em;
    }
    .marca-linea {
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.3em;
      margin-right: -0.3em;
    }
    .codigo {
      margin: 0 0 8px;
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }
    h1 {
      margin: 0 0 12px;
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 1.5rem + 1vw, 2.25rem);
      font-weight: 400;
      line-height: 1.2;
      color: var(--color-text);
    }
    .apoyo {
      margin: 0 0 32px;
      color: var(--color-text-muted);
    }
    .botones {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .boton {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 24px;
      border: 1px solid transparent;
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      transition: background-color 150ms ease-in-out;
    }
    .boton-primario {
      background: var(--color-accent);
      color: var(--color-on-accent);
    }
    .boton-primario:hover { background: var(--color-accent-hover); }
    .boton-secundario {
      background: var(--color-surface);
      border-color: var(--color-border);
      color: var(--color-text);
    }
    .boton-secundario:hover { background: var(--color-surface-alt); }
    a:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <main>
    <a href="/" class="marca" aria-label="Peache PERFUMES — inicio">
      <span class="marca-nombre">Peache</span>
      <span class="marca-linea">PERFUMES</span>
    </a>
    <p class="codigo">Error 403</p>
    <h1>Esta zona es solo para administración</h1>
    <p class="apoyo">Inicia sesión con una cuenta de administrador para continuar.</p>
    <div class="botones">
      <a href="/login?next=/dashboard" class="boton boton-primario">Iniciar sesión</a>
      <a href="/" class="boton boton-secundario">Volver a la tienda</a>
    </div>
  </main>
</body>
</html>`;
}
