import Contenedor from "@/components/ui/Contenedor";
import Enlace from "@/components/ui/Enlace";
import Marca from "@/components/ui/Marca";
import styles from "./PiePagina.module.css";

/**
 * §6 de docs/design/componentes.md — Pie.
 * Exactamente 3 bloques: marca, navegación (lista, sin `<nav>` redundante
 * con sólo 2 enlaces) y copyright. Sin datos de contacto ni legales que no
 * existan hoy (§6, regla de contenido).
 */
const ENLACES = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/catalogo", etiqueta: "Catálogo" },
];

export default function PiePagina() {
  return (
    <footer className={styles.pie}>
      <Contenedor className={styles.interior}>
        <div className={styles.marca}>
          <Marca />
          <p className={styles.lineaDescriptiva}>Perfumes seleccionados con cuidado.</p>
        </div>

        <ul className={styles.enlaces}>
          {ENLACES.map(({ href, etiqueta }) => (
            <li key={href}>
              <Enlace href={href}>{etiqueta}</Enlace>
            </li>
          ))}
        </ul>

        <p className={styles.copyright}>© 2026 Peache Perfumes</p>
      </Contenedor>
    </footer>
  );
}
