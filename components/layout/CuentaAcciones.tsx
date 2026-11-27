"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Rol } from "@/lib/auth/tipos";
import { cerrarSesion } from "@/lib/auth/acciones";
import styles from "./CuentaAcciones.module.css";

export interface CuentaCabecera {
  nombre: string | null;
  email: string;
  rol: Rol;
}

interface CuentaAccionesProps {
  cuenta: CuentaCabecera | null;
  orientacion?: "horizontal" | "vertical";
  onNavegar?: () => void;
}

/**
 * Enlaces de cuenta con el mismo estilo que la navegación principal.
 * Solo «Crear cuenta» se distingue (borde), por ser la acción a fomentar.
 */
export default function CuentaAcciones({
  cuenta,
  orientacion = "horizontal",
  onNavegar,
}: CuentaAccionesProps) {
  const rutaActual = usePathname();

  const enlace = (href: string, texto: string, destacado = false) => (
    <li>
      <Link
        href={href}
        className={`${styles.enlace} ${destacado ? styles.destacado : ""}`}
        aria-current={rutaActual === href ? "page" : undefined}
        onClick={onNavegar}
      >
        {texto}
      </Link>
    </li>
  );

  const enlacesInvitado = (
    <>
      {enlace("/login", "Iniciar sesión")}
      {enlace("/registro", "Crear cuenta", true)}
    </>
  );

  const enlacesConSesion = (
    <>
      {enlace("/pedidos", "Mis pedidos")}
      {enlace("/perfil", "Mi perfil")}
      {cuenta?.rol === "admin" ? enlace("/dashboard", "Panel") : null}
      <li>
        <form action={cerrarSesion}>
          <button type="submit" className={styles.enlace} onClick={onNavegar}>
            Cerrar sesión
          </button>
        </form>
      </li>
    </>
  );

  return (
    <nav aria-label="Cuenta" className={`${styles.cuenta} ${styles[`cuenta--${orientacion}`]}`}>
      <ul className={styles.lista}>
        {cuenta === null ? enlacesInvitado : enlacesConSesion}
      </ul>
    </nav>
  );
}
