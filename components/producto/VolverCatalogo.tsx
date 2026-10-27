import Enlace from "@/components/ui/Enlace";
import styles from "./VolverCatalogo.module.css";

/**
 * §15 del mapa de componentes → pantallas: la ficha lleva el enlace
 * «Volver al catálogo» (Enlace §3, no Botón: esto navega, no actúa).
 */
export default function VolverCatalogo() {
  return (
    <p className={styles.volver}>
      <Enlace href="/catalogo">Volver al catálogo</Enlace>
    </p>
  );
}
