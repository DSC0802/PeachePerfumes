---
name: Peache Perfumes
description: Tienda de perfumes que se lee como una revista de perfumería impresa; pagas en efectivo al recibir.
colors:
  papel: "#ffffff"
  papel-gris: "#f3f3f2"
  fondo-foto: "#ededeb"
  papel-desactivado: "#eeeeed"
  tinta: "#141414"
  tinta-secundaria: "#4f4f4f"
  tinta-pie: "#6b6b6b"
  tinta-desactivada: "#9a9a98"
  filete-fino: "#e2e2e0"
  filete-campo: "#767676"
  filete-tinta: "#141414"
  rosa-marca: "#b0485c"
  rosa-marca-hover: "#98394d"
  rosa-marca-honda: "#7f2f41"
  rosa-velado: "#f7eaed"
  sobre-rosa: "#ffffff"
  error: "#b3261e"
  exito: "#1f7a4d"
  papel-noche: "#0e0e0e"
  papel-noche-superficie: "#141414"
  papel-noche-gris: "#1c1c1c"
  tinta-noche: "#f2f2f0"
  tinta-noche-secundaria: "#bdbdba"
  tinta-noche-pie: "#a3a3a0"
  filete-noche-fino: "#2c2c2b"
  rosa-marca-noche: "#e79aa8"
  sobre-rosa-noche: "#241a1d"
  error-noche: "#f0918a"
typography:
  masthead:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(4.5rem, 1rem + 15vw, 13rem)"
    fontWeight: 500
    lineHeight: 0.82
    letterSpacing: "-0.02em"
  display:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(3rem, 1.9rem + 4.4vw, 6rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  titulo-seccion:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.75rem, 1.8rem + 3.2vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.02em"
  titulo-panel:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.25rem, 1.6rem + 2.2vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.4414rem, 2rem + 1.8vw, 3.0518rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline-sm:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(1.9531rem, 1.7rem + 1.2vw, 2.4414rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(1.5625rem, 1.4rem + 0.8vw, 1.9531rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  title-sans:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.15rem + 0.5vw, 1.5625rem)"
    fontWeight: 600
    lineHeight: 1.2
  body-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.05rem + 0.4vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.12em"
  cifra-precio:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.5625rem, 1.45rem + 0.7vw, 1.9531rem)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum', 'lnum'"
  cifra-precio-ficha:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.7rem + 2vw, 3.25rem)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum', 'lnum'"
  cifra-kpi:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.4rem + 1vw, 2.25rem)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: "'tnum', 'lnum'"
  cifra-total-carrito:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.6rem + 1.6vw, 2.75rem)"
    fontWeight: 300
    lineHeight: 1.1
    fontFeature: "'tnum', 'lnum'"
  cifra-total-pedido:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.5rem + 2vw, 3rem)"
    fontWeight: 300
    lineHeight: 1.1
    fontFeature: "'tnum', 'lnum'"
rounded:
  recto: "0px"
  pastilla: "999px"
  circulo: "50%"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "40px"
  "8": "48px"
  "9": "64px"
  "10": "80px"
  "11": "96px"
  "12": "128px"
components:
  boton-primario:
    backgroundColor: "{colors.rosa-marca}"
    textColor: "{colors.sobre-rosa}"
    rounded: "{rounded.recto}"
    padding: "0 24px"
    height: "44px"
  boton-primario-hover:
    backgroundColor: "{colors.rosa-marca-hover}"
  boton-primario-active:
    backgroundColor: "{colors.rosa-marca-honda}"
  boton-secundario:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.recto}"
    padding: "0 24px"
    height: "44px"
  boton-secundario-hover:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
  boton-terciario:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    padding: "0 24px"
    height: "44px"
  chip-filtro:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.recto}"
    padding: "0 16px"
    height: "44px"
  chip-filtro-activo:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
  campo-texto:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.recto}"
    padding: "0 12px"
    height: "44px"
  etiqueta-nuevo:
    textColor: "{colors.rosa-marca}"
    rounded: "{rounded.recto}"
    padding: "2px 8px"
  etiqueta-estado:
    textColor: "{colors.tinta}"
    rounded: "{rounded.recto}"
    padding: "2px 8px"
  etiqueta-agotado:
    textColor: "{colors.error}"
    rounded: "{rounded.recto}"
    padding: "2px 8px"
  contador-panel:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.pastilla}"
    padding: "1px 8px"
---

# Design System: Peache Perfumes

## Overview

**Creative North Star: "La revista de perfumes"**

La tienda se lee como una revista de perfumería impresa en papel couché. Papel blanco, una sola tinta negra para el texto, los filetes y las barras, un gris de pie de foto, y el rosa de marca reservado: la acción principal, la etiqueta «Nuevo» y el logotipo. La portada abre con una cabecera PEACHE a todo el ancho entre filetes, una línea de edición en versalitas y un titular Bodoni junto a una foto a sangre; las secciones se separan con filetes de tinta, no con cajas.

La jerarquía la dan la tipografía y los filetes. Bodoni Moda, con su eje óptico, compone titulares y nombres de perfume; Archivo compone el texto, la interfaz y todas las cifras en tabulares. Las esquinas son rectas, no hay tarjetas ni sombras en la página, y el movimiento es discreto: subrayados que se dibujan, una foto que se acerca un 3 % y un único gesto con autoría, el pase de página del Hojeador (700 ms). El panel de administración es la edición sobria del mismo mundo: cifras bajo un filete de 2 px, barras en tinta, contadores en tinta.

El modo oscuro es la misma revista impresa en papel negro: se invierten papel y tinta y el rosa se aclara para seguir pasando AA.

**Key Characteristics:**
- Papel y una tinta; el rosa sólo en la acción principal, «Nuevo» y el logotipo.
- Bodoni Moda para titulares; Archivo para texto y cifras tabulares.
- Esquinas rectas; jerarquía por filetes (1 px y 2 px en tinta) en lugar de cajas o sombras.
- Rótulos en versalitas espaciadas (0.75rem, 600, 0.12em).
- Movimiento sutil y un solo gesto protagonista: el pase de página.

## Colors

Una tinta casi negra sobre papel blanco, grises neutros sin tinte y un rosa de marca oscurecido hasta AA, usado con avaricia.

### Primary
- **Rosa de marca** (#b0485c; noche #e79aa8): fondo del botón primario, texto y borde de la etiqueta «Nuevo», el wordmark de `Marca`, el anillo de foco y `accent-color`/`caret-color` del navegador. Al pasar el puntero baja a **rosa hover** (#98394d) y al pulsar a **rosa hondo** (#7f2f41). Sobre él, texto **sobre-rosa** (#ffffff; noche #241a1d).
- **Rosa velado** (#f7eaed; noche #2e2126): token `--color-accent-subtle`, disponible para fondos tenues del acento; no tiene uso de superficie en la página.

### Neutral
- **Papel** (#ffffff; noche #0e0e0e de fondo y #141414 de superficie): fondo de página y de superficies. No hay papel de color.
- **Papel gris** (#f3f3f2; noche #1c1c1c): hover de chips y botones de icono, campos de sólo lectura.
- **Fondo de foto** (#ededeb; noche #1f1f1e): el estudio detrás de las fotos de producto en `MarcoImagen`.
- **Tinta** (#141414; noche #f2f2f0): todo el texto, los filetes de revista (`--color-rule`), las barras del panel, el relleno del chip activo y de los contadores, la selección de texto (invertida).
- **Tinta secundaria** (#4f4f4f; noche #bdbdba): entradillas, metadatos, navegación en reposo.
- **Tinta de pie** (#6b6b6b; noche #a3a3a0): folios, numeración del Hojeador, placeholders. Pasa 4.5:1 sobre papel.
- **Filete fino** (#e2e2e0; noche #2c2c2b): divisores entre filas dentro de una sección (`--color-border`).
- **Filete de campo** (#767676; noche #8a8a87): borde de campos y chips (`--color-border-strong`), ≥ 3:1 como componente.

### Estados
- **Error** (#b3261e; noche #f0918a): etiqueta «Agotado», borde y mensaje de campo inválido, botón de peligro. Es el único color funcional que aparece en la página.
- Éxito (#1f7a4d), aviso (#8a5a00) e información (#1a5b8a), con sus fondos, existen como tokens pero las etiquetas de estado los imprimen en tinta.

### Named Rules
**The Una Tinta Rule.** Todo lo que no es la acción principal, «Nuevo», el logotipo o un error se imprime en tinta y sus grises. Los estados de pedido, las métricas del panel y las barras no tienen color por tono.

**The Rosa Avaro Rule.** El rosa nunca colorea enlaces, títulos, fondos de sección ni gráficos. Si una pantalla tiene dos botones rosas, uno sobra.

## Typography

**Display Font:** Bodoni Moda variable (con Bodoni 72, Didot, Georgia, serif), autoalojada, `font-optical-sizing: auto`.
**Body Font:** Archivo variable (con system-ui, Segoe UI, Roboto, Arial), autoalojada, ancho normal.
**Cifras:** Archivo con `font-variant-numeric: tabular-nums lining-nums` (elemento `<data>` y clase `.cifras`).

**Character:** Una Didona de revista de moda que ajusta su contraste al tamaño, frente a una grotesca sobria que hace todo el trabajo de interfaz y de números. La serif titula; la sans informa y cuenta.

### Hierarchy
- **Masthead** (500, `clamp(4.5rem, 1rem + 15vw, 13rem)`, 0.82, -0.02em, mayúsculas): sólo la cabecera PEACHE de la portada, sin partir y sin scroll lateral.
- **Display** (500, `clamp(3rem, 1.9rem + 4.4vw, 6rem)`, 0.98, -0.02em): titular de portada y nombre del perfume en cada página del Hojeador. Máx. 12ch.
- **Título de sección** (500, `clamp(2.75rem, 1.8rem + 3.2vw, 4.5rem)`, 1): el `h1` de `Contenedor` en modo sección, sobre filete de 2 px.
- **Título de panel** (500, `clamp(2.25rem, 1.6rem + 2.2vw, 3.5rem)`, 1): el `h1` de cada vista del panel, sobre filete de 2 px.
- **Headline** (500, `--font-size-h1` `clamp(2.4414rem, 2rem + 1.8vw, 3.0518rem)`, 1.1): títulos de bloque (Hojeador, perfume en portada). `--font-size-h2` `clamp(1.9531rem, 1.7rem + 1.2vw, 2.4414rem)` para el siguiente nivel.
- **Title** (500, `--font-size-h3` `clamp(1.5625rem, 1.4rem + 0.8vw, 1.9531rem)`, 1.08): nombre del perfume en la tarjeta y enlaces del menú vertical.
- **Title sans** (600, `--font-size-h4`, 1.2): el `h4` es de interfaz, en Archivo.
- **Body** (400, 1rem, 1.6): texto corrido, 40–48ch. **Body grande** (`clamp(1rem, 1.05rem + 0.4vw, 1.25rem)`) para entradillas.
- **Label / versalitas** (600, 0.75rem, 0.12em, mayúsculas): marca del perfume, línea de edición, rótulos de datos, chips, botones (éstos a 0.875rem), títulos de métricas.

### Cifras
- **Precio** (300, `clamp(1.5625rem, 1.45rem + 0.7vw, 1.9531rem)`): `Precio` variante ficha. En la tarjeta, body grande a 500.
- **Precio de ficha** (300, `clamp(2.25rem, 1.7rem + 2vw, 3.25rem)`): la única cifra grande de la ficha de producto.
- **Cifra KPI** (300, `clamp(1.75rem, 1.4rem + 1vw, 2.25rem)`, 1.05): métricas del panel; 500 en tono «aviso».
- **Total del carrito** (`clamp(2rem, 1.6rem + 1.6vw, 2.75rem)`) y **total del pedido** (`clamp(2rem, 1.5rem + 2vw, 3rem)`).

### Named Rules
**The Serif Titula Rule.** Bodoni sólo en `h1`–`h3`, nombres de perfume, masthead, numeración del Hojeador y menú vertical. Nunca en botones, rótulos ni cifras.

**The Cifras Tabulares Rule.** Todo número que se compara (precios, stock, totales, recuentos, métricas) va en Archivo tabular. Los tamaños fluidos de cifras de esta lista son los únicos fuera de la escala 1.25; un tamaño nuevo se añade aquí antes de usarse.

## Layout

Mobile-first con breakpoints 640 / 768 / 1024 px. Contenedores de 72rem (máximo), 42rem (estrecho) y 84rem (ancho), con margen lateral de 16 → 24 → 32 px. Escala de espacio única de base 4 px (4–128 px). El hueco entre secciones crece 64 → 80 → 96 px; el de rejilla 16 → 24 → 32 px. Objetivo táctil de 44 px.

La portada es una rejilla de dos columnas desde 1024 px (texto y perfume destacado a la izquierda, foto 4:5 a la derecha); en móvil se apila y la foto llega a los bordes (margen negativo igual al del contenedor). El Hojeador es una pista horizontal con `scroll-snap` obligatorio, una página por pantalla, foto 1.1fr y texto 0.9fr. El catálogo es una rejilla de tarjetas sin marco; el panel es rejilla de una o dos columnas (desde 900 px) con secciones separadas por 48 px.

## Elevation & Depth

Plano. La página no tiene sombras: la profundidad se expresa con filetes de tinta y con el cambio de papel (blanco / gris / fondo de foto). En modo oscuro la separación la dan superficies algo más claras.

### Shadow Vocabulary
- **Capa flotante** (`box-shadow: 0 12px 32px rgb(20 20 20 / 0.14)`; noche `0 8px 24px rgb(0 0 0 / 0.5)`): sólo `HojaModal`, el único objeto que flota sobre la página.
- **Sombra mínima** (`0 1px 2px rgb(20 20 20 / 0.06)`): token `--shadow-1` reservado para menús desplegables.
- **Filete interior** (`box-shadow: inset 2px 0 0 var(--color-rule)`): no es elevación; marca el enlace activo del menú del panel.

### Named Rules
**The Filete, No Caja Rule.** Una sección se abre con un filete de tinta (`--rule-width-strong`, 2 px) y se titula; las filas internas se separan con filete fino (`--color-border`, 1 px). Nunca un rectángulo con sombra para agrupar contenido.

## Shapes

Papel impreso: `--radius: 0` en botones, campos, chips, etiquetas, hojas modales y fotos. Bordes de 1 px (`--border-width`, `--rule-width`) y 2 px (`--rule-width-strong`). Dos excepciones, ambas del panel: la **pastilla** de 999 px de los contadores (pedidos pendientes, notificaciones sin leer) y de la insignia «próximamente» del menú lateral, y el **círculo** (50 %) del avatar de iniciales. Proporciones de foto: 4:5 en tarjeta, portada y Hojeador; 1:1 en ficha; 3:2 editorial.

## Components

### Buttons
Versalitas sobre esquina recta; firme sin ser pesado.
- **Shape:** recto (0). Alturas 36 / 44 / 52 px; padding 12 / 24 / 40 px.
- **Primary:** fondo rosa de marca, texto blanco, Archivo 600 a 0.875rem, 0.12em, mayúsculas. Hover rosa hover, active rosa hondo.
- **Hover / Focus:** transición de color 150 ms; `:active` escala 0.97 (anulado con movimiento reducido). Foco: anillo de 2 px en rosa a 3 px de distancia.
- **Secundario:** transparente con borde de tinta 1 px; al pasar el puntero se invierte (fondo tinta, texto papel).
- **Terciario:** texto en tinta subrayado a 1 px, offset 0.45em; hover a tinta secundaria.
- **Peligro:** fondo error, hover/active por opacidad. Desactivado: papel desactivado y tinta desactivada.

### Chips (filtros)
- **Style:** papel con borde filete de campo 1 px, versalitas 0.75rem, 44 px de alto.
- **State:** hover papel gris; activo relleno de tinta con texto papel. `:active` escala 0.97.

### Etiquetas
- **Style:** contorno 1 px en `currentColor`, sin relleno, versalitas 0.75rem, padding 2px 8px.
- **Variantes:** «Nuevo» en rosa; estados de pedido (éxito, información) en tinta; neutral en tinta secundaria; «Agotado» en error. Sobre fotos llevan fondo de papel.

### Cards / Containers (tarjeta de producto)
- **Corner Style:** recto, sin borde ni fondo propio.
- **Composición:** foto 4:5 sobre fondo de foto, debajo marca en versalitas, nombre en Bodoni (title) a dos líneas, metadatos en tinta secundaria, precio al pie.
- **Hover (puntero fino):** la foto escala a 1.03 en 600 ms y el subrayado del nombre se dibuja de 0 a 100 % en 400 ms. Anulado con movimiento reducido.

### Inputs / Fields
- **Style:** papel, borde filete de campo 1 px, recto, 44 px, Archivo 1rem. Etiqueta 0.875rem 500 encima.
- **Focus:** borde a tinta más anillo global rosa.
- **Error / Disabled:** borde y mensaje en error con icono; desactivado en papel y tinta desactivados; sólo lectura en papel gris.

### Navigation
- **Cabecera:** fija, papel, filete de tinta 1 px abajo, wordmark `Marca` en rosa.
- **Enlaces:** versalitas 0.875rem 500 en tinta secundaria; hover y página actual pasan a tinta y muestran subrayado de 1 px a 0.45em.
- **Menú vertical (móvil):** enlaces en Bodoni (title) separados por filete fino.
- **Menú del panel:** filas de 44 px separadas por filete fino; la activa en tinta 600 con filete interior de 2 px a la izquierda.

### Portada y Hojeador (firma)
La portada: masthead entre filete de 2 px, línea de edición en versalitas entre filetes, titular display, perfume destacado bajo filete de 1 px con subrayado que se dibuja en el nombre. El Hojeador: sección abierta por filete de 2 px, folio y flechas cuadradas de 44 px con borde de tinta (hover invertido), páginas con número Bodoni en tinta de pie, nombre display y tabla de datos entre filetes. Al pasar página el texto entra subiendo 16 px y apareciendo en 700 ms (`--duration-page`), escalonado 40 / 80 / 120 ms; las páginas no actuales llevan `visibility: hidden` para salir del foco y de la lectura.

### Panel (edición sobria)
- **Encabezado de vista:** título de panel en Bodoni sobre filete de 2 px.
- **Métrica:** filete de tinta de 2 px arriba, título en versalitas, cifra KPI ligera en tabulares, detalle en tinta secundaria. Sin tarjeta, sin sombra, sin color por tono.
- **Gráfico de barras:** barras rellenas de tinta sobre línea base de 1 px en tinta; valores en tabulares.
- **Contador:** pastilla de tinta con cifra en papel, 0.75rem 700 tabular.

## Do's and Don'ts

### Do:
- **Do** abrir cada sección con un filete de tinta de 2 px (`--rule-width-strong`, `--color-rule`) y separar filas con filete fino de 1 px.
- **Do** reservar el rosa de marca para el botón primario, la etiqueta «Nuevo» y el logotipo.
- **Do** componer titulares y nombres de perfume en Bodoni Moda y todas las cifras en Archivo tabular.
- **Do** usar los tamaños fluidos documentados (título de sección, título de panel, KPI, totales, precio de ficha, masthead) y añadir aquí cualquier tamaño nuevo antes de usarlo.
- **Do** mantener el contraste de texto ≥ 4.5:1 en ambos modos, incluidos placeholders y pies.
- **Do** ocultar las páginas no actuales de un carrusel con `visibility: hidden`, no sólo con opacidad.
- **Do** hacer que todo movimiento use los tokens de duración o tenga su bloque `prefers-reduced-motion`.

### Don't:
- **Don't** poner rótulos o «eyebrows» en versalitas encima de los titulares; la marca del perfume sobre su nombre es un dato, no un adorno.
- **Don't** usar texto con degradado, ni vidrio (`backdrop-filter`), ni sombras en la página fuera de `HojaModal`.
- **Don't** redondear esquinas; la pastilla de 999 px es sólo para los contadores e insignias del menú del panel, y el círculo sólo para el avatar.
- **Don't** agrupar contenido en tarjetas con borde y sombra, tampoco en el panel.
- **Don't** colorear estados, métricas o barras por tono; el rojo de error sólo marca agotado, errores y peligro.
- **Don't** usar fuentes del sistema como display ni introducir una tercera familia.
