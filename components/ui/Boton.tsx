import type { AnchorHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import Link from "next/link";
import styles from "./Boton.module.css";

/**
 * §1 de docs/design/componentes.md — Botón.
 * Acciones (no navegación). Si `href` se provide, se renderiza como enlace
 * con estética de botón (elemento real `<a>`), para CTA que navegan
 * ("Ver el catálogo", mapa §15).
 */
export type VarianteBoton = "primario" | "secundario" | "terciario" | "peligro";
export type TamanoBoton = "sm" | "md" | "lg";

export interface BotonProps {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  /** Estado `loading`: texto original en DOM (oculto visualmente) + spinner + "Cargando…". */
  loading?: boolean;
  iconoIzquierda?: ReactNode;
  iconoDerecha?: ReactNode;
  href?: string;
  className?: string;
  children: ReactNode;
  type?: "submit" | "reset" | "button";
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
  id?: string;
  name?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
}

function esExterno(href: string): boolean {
  return /^(?:https?:)?\/\//.test(href) || href.startsWith("mailto:");
}

export default function Boton({
  variante = "primario",
  tamano = "md",
  loading = false,
  iconoIzquierda,
  iconoDerecha,
  href,
  className,
  children,
  type = "button",
  disabled = false,
  title,
  "aria-label": ariaLabel,
  id,
  name,
  onClick,
}: BotonProps) {
  const clases = [
    styles.boton,
    styles[`boton--${variante}`],
    styles[`boton--${tamano}`],
    loading ? styles["boton--loading"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconoIzquierdaMarcado = iconoIzquierda ? (
    <span className={styles.boton__icono} aria-hidden="true">
      {iconoIzquierda}
    </span>
  ) : null;

  const iconoDerechaMarcado = iconoDerecha ? (
    <span className={styles.boton__icono} aria-hidden="true">
      {iconoDerecha}
    </span>
  ) : null;

  if (href) {
    const contenido = (
      <>
        {iconoIzquierdaMarcado}
        {children}
        {iconoDerechaMarcado}
      </>
    );
    const atributos = {
      className: clases,
      title,
      "aria-label": ariaLabel,
      onClick,
    } satisfies AnchorHTMLAttributes<HTMLAnchorElement>;

    if (esExterno(href)) {
      return (
        <a href={href} rel="noopener" {...atributos}>
          {contenido}
        </a>
      );
    }
    return (
      <Link href={href} {...atributos}>
        {contenido}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={clases}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      title={title}
      aria-label={ariaLabel}
      id={id}
      name={name}
      onClick={onClick}
    >
      {loading ? (
        <>
          <span className="solo-lectura">{children}</span>
          <span className={styles.boton__cargando}>
            <svg
              className={styles.boton__spinner}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="30"
                strokeDashoffset="10"
              />
            </svg>
            Cargando…
          </span>
        </>
      ) : (
        <>
          {iconoIzquierdaMarcado}
          {children}
          {iconoDerechaMarcado}
        </>
      )}
    </button>
  );
}
