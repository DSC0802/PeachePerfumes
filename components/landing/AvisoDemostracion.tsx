import Contenedor from "@/components/ui/Contenedor";
import styles from "./AvisoDemostracion.module.css";

const ID_TITULO = "aviso-demostracion";

/**
 * Aviso visible y único de datos de demostración (arquitectura §6, riesgo R3):
 * banda pegada bajo la cabecera en la portada. Va como texto —no como color
 * suelto— para que se lea en ambos modos y con lector de pantalla (§8).
 */
export default function AvisoDemostracion() {
  return (
    <aside className={styles.aviso} role="note" aria-labelledby={ID_TITULO}>
      <Contenedor>
        <p className={styles.texto}>
          <strong id={ID_TITULO} className={styles.titulo}>
            Productos de demostración.
          </strong>{" "}
          Los perfumes, las marcas, los precios y la disponibilidad son inventados: no
          corresponden a productos reales.
        </p>
      </Contenedor>
    </aside>
  );
}
