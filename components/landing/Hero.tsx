import Boton from "@/components/ui/Boton";
import MarcoImagen from "@/components/ui/MarcoImagen";
import styles from "./Hero.module.css";

/**
 * Hero de portada (estados §3.1): la frase display ES el `h1` (el wordmark es
 * imagen con alt). Mobile-first apilado y **sin texto sobre foto** (§14.4:
 * patrón hero dividido — el titular va al lado o debajo de la foto).
 */
export interface HeroProps {
  /** Frase display del `h1` de portada. */
  titulo: string;
  /** Entradilla opcional bajo la frase. */
  entradilla?: string;
  /** CTA de navegación (p. ej. "Ver el catálogo", mapa §15). */
  cta?: { etiqueta: string; href: string };
  /** 16/9 en móvil → 3/2 ≥768px (§14.3). Sin imagen: placeholder. */
  imagen?: { src: string; alt: string };
}

export default function Hero({ titulo, entradilla, cta, imagen }: HeroProps) {
  return (
    <section className={styles.hero} aria-label="Presentación">
      <div className={styles.texto}>
        <h1 className={styles.titulo}>{titulo}</h1>
        {entradilla ? <p className={styles.entradilla}>{entradilla}</p> : null}
        {cta ? (
          <div className={styles.accion}>
            <Boton variante="primario" tamano="lg" href={cta.href}>
              {cta.etiqueta}
            </Boton>
          </div>
        ) : null}
      </div>
      <MarcoImagen
        variante="hero"
        imagen={imagen}
        prioridad
        className={styles.media}
      />
    </section>
  );
}
