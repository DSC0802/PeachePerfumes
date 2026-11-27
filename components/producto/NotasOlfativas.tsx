import type { Producto } from "@/lib/catalogo";
import styles from "./NotasOlfativas.module.css";

type NotasProducto = Producto["notas"];

/**
 * Notas del perfume en tres filas entre filetes: salida, corazón y fondo,
 * cada una con cuándo se percibe. El orden de lectura es el del tiempo.
 */
const GRUPOS = [
  { clave: "salida", titulo: "Salida", cuando: "Primeros minutos" },
  { clave: "corazon", titulo: "Corazón", cuando: "Durante horas" },
  { clave: "fondo", titulo: "Fondo", cuando: "La estela final" },
] as const;

export default function NotasOlfativas({ notas }: { notas: NotasProducto }) {
  const grupos = GRUPOS.filter((grupo) => notas[grupo.clave].length > 0);
  if (grupos.length === 0) return null;

  return (
    <section className={styles.notas} aria-labelledby="ficha-notas">
      <h2 id="ficha-notas" className={styles.titulo}>
        Notas olfativas
      </h2>
      <ol className={styles.capas}>
        {grupos.map((grupo) => (
          <li key={grupo.clave} className={styles.capa}>
            <div className={styles.cabecera}>
              <h3 className={styles.subtitulo}>{grupo.titulo}</h3>
              <p className={styles.cuando}>{grupo.cuando}</p>
            </div>
            <p className={styles.lista}>{notas[grupo.clave].join(", ")}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
