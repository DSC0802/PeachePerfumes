import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./Enlace.module.css";

/**
 * §3 de docs/design/componentes.md — Enlace.
 * Navegación (rutas internas) y referencias. No es botón.
 * `visited` no se altera (regla §3); el foco lo aporta globals.css.
 */
export interface EnlaceProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

function esExterno(href: string): boolean {
  return /^(?:https?:)?\/\//.test(href) || href.startsWith("mailto:");
}

export default function Enlace({ href, children, className, rel, ...resto }: EnlaceProps) {
  const clases = className ? `${styles.enlace} ${className}` : styles.enlace;

  if (esExterno(href)) {
    return (
      <a href={href} className={clases} rel={rel ?? "noopener"} {...resto}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={clases} rel={rel} {...resto}>
      {children}
    </Link>
  );
}
