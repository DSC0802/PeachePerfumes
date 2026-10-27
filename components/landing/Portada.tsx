import type { ReactNode } from "react";
import Contenedor from "@/components/ui/Contenedor";
import styles from "./Portada.module.css";

export interface PortadaProps {
  children: ReactNode;
}

/**
 * Envoltorio de la portada (estados §3.1): contenedor común del sistema y
 * ritmo vertical entre bloques (`--section-gap`). El aviso de demostración
 * queda fuera de este envoltorio, pegado a la cabecera.
 */
export default function Portada({ children }: PortadaProps) {
  return <Contenedor className={styles.portada}>{children}</Contenedor>;
}
