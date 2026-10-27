import type { Producto } from "@/lib/catalogo";
import styles from "./NotasOlfativas.module.css";

type NotasProducto = Producto["notas"];

/**
 * §3.2 — pirámide de notas: salida / corazón / fondo, cada grupo con su
 * propio encabezado (`h3` bajo el `h2` de la sección) y lista legible
 * (arquitectura §8: jerarquía `h2`/`h3` sin saltos).
 */
const GRUPOS = [
  { clave: "salida", titulo: "Salida" },
  { clave: "corazon", titulo: "Corazón" },
  { clave: "fondo", titulo: "Fondo" },
] as const;

export default function NotasOlfativas({ notas }: { notas: NotasProducto }) {
  return (
    <section className={styles.piramide} aria-labelledby="ficha-piramide">
      <h2 id="ficha-piramide" className={styles.titulo}>
        Pirámide olfativa
      </h2>
      <div className={styles.grupos}>
        {GRUPOS.map((grupo) => (
          <div key={grupo.clave} className={styles.grupo}>
            <h3 className={styles.subtitulo}>{grupo.titulo}</h3>
            <ul className={styles.lista}>
              {notas[grupo.clave].map((nota) => (
                <li key={nota}>{nota}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
