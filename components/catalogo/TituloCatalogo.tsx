import styles from "./TituloCatalogo.module.css";

/**
 * `h1` de `/catalogo`: «Catálogo» con `--font-size-h2` (estados §2.1.1: en
 * esta pantalla el `h1` lleva el tamaño tipográfico de h2). Compartido por la
 * página, `loading.tsx` y `error.tsx` para que el encabezado no cambie de un
 * estado a otro (§4.3: «la cabecera, el `h1` y el pie siguen ahí»).
 */
export default function TituloCatalogo() {
  return <h1 className={styles.titulo}>Catálogo</h1>;
}
