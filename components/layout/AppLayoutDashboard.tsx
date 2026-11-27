"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import styles from "./AppLayoutDashboard.module.css";

export interface ContadoresPanel {
  /** Pedidos pendientes de atender. */
  pedidos: number;
  /** Notificaciones sin leer. */
  notificaciones: number;
}

const TEXTO_CONTADOR: Record<keyof ContadoresPanel, [string, string]> = {
  pedidos: ["pedido pendiente", "pedidos pendientes"],
  notificaciones: ["notificación sin leer", "notificaciones sin leer"],
};

export interface CuentaPanel {
  nombre: string | null;
  email: string;
}

interface EnlacePanel {
  href: string;
  etiqueta: string;
  icono: ReactNode;
  /** Sección todavía sin construir: se muestra, pero no es un enlace. */
  proximamente?: string;
  /** Muestra la insignia con el recuento indicado (pedidos pendientes, no leídas). */
  contador?: keyof ContadoresPanel;
}

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ENLACES: EnlacePanel[] = [
  {
    href: "/dashboard",
    etiqueta: "Resumen",
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="3.5" width="7" height="4" rx="1" />
        <rect x="13.5" y="10.5" width="7" height="10" rx="1" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/pedidos",
    etiqueta: "Pedidos",
    contador: "pedidos",
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <path d="M4 7.5 12 3.5l8 4v9l-8 4-8-4z" />
        <path d="M4 7.5l8 4 8-4" />
        <path d="M12 11.5v9" />
      </svg>
    ),
  },
  {
    href: "/dashboard/productos",
    etiqueta: "Productos",
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <path d="M10 3.5h4v3h-4z" />
        <path d="M8 6.5h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2z" />
        <path d="M9.5 12.5h5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/reportes",
    etiqueta: "Reportes",
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <path d="M4 20.5h16" />
        <path d="M7 17v-5" />
        <path d="M12 17V7" />
        <path d="M17 17v-8" />
      </svg>
    ),
  },
  {
    href: "/dashboard/clientes",
    etiqueta: "Clientes",
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <circle cx="9" cy="8.5" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6" />
        <path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/notificaciones",
    etiqueta: "Notificaciones",
    contador: "notificaciones",
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
        <path d="M10 20.5a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    href: "/dashboard/ajustes",
    etiqueta: "Ajustes",
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M14.8 9.2c-.5-1-1.6-1.6-2.8-1.6-1.6 0-2.8.9-2.8 2.1 0 2.9 5.6 1.5 5.6 4.5 0 1.2-1.3 2.2-2.8 2.2-1.3 0-2.4-.6-2.9-1.7" />
        <path d="M12 6v1.6M12 16.4V18" />
      </svg>
    ),
  },
];

function activo(rutaActual: string, href: string): boolean {
  return href === "/dashboard" ? rutaActual === href : rutaActual.startsWith(href);
}

/** Shell del panel (F3-C): barra lateral + contenido. Va dentro del layout raíz. */
export default function AppLayoutDashboard({
  cuenta,
  contadores,
  children,
}: {
  cuenta: CuentaPanel;
  contadores: ContadoresPanel;
  children: ReactNode;
}) {
  const rutaActual = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className={styles.shell}>
      <aside className={styles.lateral} aria-label="Panel de administración">
        <div className={styles.lateral__cabecera}>
          <p className={styles.lateral__titulo}>Administración</p>
          <button
            type="button"
            className={styles.conmutador}
            aria-expanded={menuAbierto}
            aria-controls="navegacion-panel"
            onClick={() => setMenuAbierto((v) => !v)}
          >
            {menuAbierto ? "Cerrar menú" : "Menú del panel"}
          </button>
        </div>

        <nav
          id="navegacion-panel"
          className={[styles.nav, menuAbierto ? styles["nav--abierta"] : null].filter(Boolean).join(" ")}
          aria-label="Secciones del panel"
        >
          <ul className={styles.lista}>
            {ENLACES.map((enlace) => (
              <li key={enlace.href}>
                {enlace.proximamente ? (
                  <span className={`${styles.enlace} ${styles["enlace--inactivo"]}`}>
                    <span className={styles.icono} aria-hidden="true">
                      {enlace.icono}
                    </span>
                    {enlace.etiqueta}
                    <span className={styles.insignia}>
                      <span className="solo-lectura">Disponible en </span>
                      {enlace.proximamente}
                    </span>
                  </span>
                ) : (
                  <Link
                    href={enlace.href}
                    className={styles.enlace}
                    aria-current={activo(rutaActual, enlace.href) ? "page" : undefined}
                    onClick={() => setMenuAbierto(false)}
                  >
                    <span className={styles.icono} aria-hidden="true">
                      {enlace.icono}
                    </span>
                    {enlace.etiqueta}
                    {enlace.contador && contadores[enlace.contador] > 0 ? (
                      <span className={styles.contador}>
                        {contadores[enlace.contador]}
                        <span className="solo-lectura">
                          {" "}
                          {TEXTO_CONTADOR[enlace.contador][contadores[enlace.contador] === 1 ? 0 : 1]}
                        </span>
                      </span>
                    ) : null}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className={styles.cuenta}>
            <span className={styles.avatar} aria-hidden="true">
              {(cuenta.nombre ?? cuenta.email).charAt(0).toUpperCase()}
            </span>
            <span className={styles.cuenta__texto}>
              <span className={styles.cuenta__nombre}>{cuenta.nombre ?? "Administrador"}</span>
              <span className={styles.cuenta__email}>{cuenta.email}</span>
            </span>
          </div>
        </nav>
      </aside>

      <div className={styles.contenido}>{children}</div>
    </div>
  );
}
