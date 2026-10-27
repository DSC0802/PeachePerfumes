import Link from "next/link";
import type { Categoria } from "@/lib/catalogo";
import { FAMILIAS } from "./familias";
import styles from "./SeccionExplorar.module.css";

const ID_TITULO = "explorar-titulo";

export interface SeccionExplorarProps {
  /** Categorías desde `catalogo.listarCategorias()`. */
  categorias: Categoria[];
}

/**
 * Navegación de la portada hacia el catálogo: familias olfativas
 * (`/catalogo?familia=…`, estado de chips §2.1) y categorías
 * (`/catalogo?categoria=…`). Aquí son **enlaces** de navegación —no bots de
 * filtro: no hay estado que pulsar, sólo hacia dónde se va.
 */
export default function SeccionExplorar({ categorias }: SeccionExplorarProps) {
  return (
    <nav className={styles.seccion} aria-labelledby={ID_TITULO}>
      <h2 id={ID_TITULO} className={styles.titulo}>
        Explora el catálogo
      </h2>
      <p className={styles.entradilla}>
        Cada familia agrupa perfumes por el carácter que dejan en la piel.
      </p>

      <div className={styles.grupo}>
        <h3 className={styles.subtitulo}>Familias olfativas</h3>
        <ul className={styles.lista}>
          {FAMILIAS.map(({ slug, nombre }) => (
            <li key={slug}>
              <Link href={`/catalogo?familia=${slug}`} className={styles.chip}>
                {nombre}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {categorias.length > 0 ? (
        <div className={styles.grupo}>
          <h3 className={styles.subtitulo}>Categorías</h3>
          <ul className={styles.lista}>
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <Link href={`/catalogo?categoria=${categoria.slug}`} className={styles.chip}>
                  {categoria.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
