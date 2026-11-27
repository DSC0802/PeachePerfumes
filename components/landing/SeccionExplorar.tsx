import Link from "next/link";
import type { Categoria, FamiliaOlfativa } from "@/lib/catalogo";
import Contenedor from "@/components/ui/Contenedor";
import styles from "./SeccionExplorar.module.css";

/**
 * Índice por familia olfativa: cada fila es un enlace al catálogo filtrado,
 * con el recuento real de perfumes y las notas que más se repiten en esa
 * familia (calculadas del catálogo, no escritas a mano).
 */
export interface FilaFamilia {
  slug: FamiliaOlfativa;
  nombre: string;
  total: number;
  notas: string[];
}

export interface SeccionExplorarProps {
  familias: FilaFamilia[];
  categorias: Categoria[];
}

export default function SeccionExplorar({ familias, categorias }: SeccionExplorarProps) {
  const conPerfumes = familias.filter((f) => f.total > 0);
  return (
    <section className={styles.seccion} aria-labelledby="explorar-titulo">
      <Contenedor ancho="ancho">
        <div className={styles.cabecera}>
          <h2 id="explorar-titulo" className={styles.titulo}>
            Índice por familias
          </h2>
          <p className={styles.apoyo}>
            Cada familia agrupa perfumes por el carácter que dejan en la piel. Las notas son las que
            más se repiten en nuestro catálogo.
          </p>
        </div>

        <ul className={styles.indice}>
          {conPerfumes.map((familia, i) => (
            <li key={familia.slug}>
              <Link href={`/catalogo?familia=${familia.slug}`} className={styles.fila}>
                <span className={`${styles.orden} cifras`} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.nombre}>{familia.nombre}</span>
                <span className={styles.notas}>{familia.notas.join(", ")}</span>
                <span className={`${styles.total} cifras`}>
                  {familia.total} {familia.total === 1 ? "perfume" : "perfumes"}
                </span>
                <svg className={styles.flecha} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                  <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>

        {categorias.length > 0 ? (
          <nav className={styles.categorias} aria-label="Perfumes por categoría">
            <span className={styles.categoriasRotulo}>También por categoría:</span>
            {categorias.map((categoria) => (
              <Link key={categoria.id} href={`/catalogo?categoria=${categoria.slug}`} className={styles.categoria}>
                {categoria.nombre}
              </Link>
            ))}
          </nav>
        ) : null}
      </Contenedor>
    </section>
  );
}
