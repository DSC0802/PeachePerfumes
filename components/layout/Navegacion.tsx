import Link from "next/link";
import styles from "./Navegacion.module.css";

/**
 * §5 de docs/design/componentes.md — Navegación (Fase 2): Inicio y Catálogo,
 * dos enlaces, sin mega-menú y sin enlaces a rutas inexistentes (arquitectura §5).
 */
const ENLACES = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/catalogo", etiqueta: "Catálogo" },
];

export interface NavegacionProps {
  /** Ruta actual para marcar `aria-current="page"` (§5). */
  rutaActual?: string;
  orientacion?: "horizontal" | "vertical";
  /** En el menú móvil: cierra el sheet antes de navegar (§5). */
  onNavegar?: () => void;
}

export default function Navegacion({
  rutaActual,
  orientacion = "horizontal",
  onNavegar,
}: NavegacionProps) {
  const clases = [styles.navegacion, styles[`navegacion--${orientacion}`]]
    .filter(Boolean)
    .join(" ");

  return (
    <nav aria-label="Principal" className={clases}>
      <ul className={styles.lista}>
        {ENLACES.map(({ href, etiqueta }) => {
          const activo = rutaActual === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={styles.enlace}
                aria-current={activo ? "page" : undefined}
                onClick={onNavegar}
              >
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
