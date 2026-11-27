import Contenedor from "@/components/ui/Contenedor";
import styles from "./PasosPedido.module.css";

/**
 * «Cómo comprar»: lo que pasa después de pedir, en tres columnas. La
 * numeración sí informa (es una secuencia), por eso se muestra.
 */
const PASOS = [
  {
    titulo: "Eliges y pides",
    texto: "Añade tus perfumes al carrito y deja tu nombre y tu teléfono de WhatsApp.",
  },
  {
    titulo: "Coordinamos la entrega",
    texto: "Te escribimos para acordar el día y el lugar donde recibirlo.",
  },
  {
    titulo: "Pagas al recibir",
    texto: "Pagas en efectivo cuando tienes el perfume en la mano. Nunca por adelantado.",
  },
] as const;

export default function PasosPedido() {
  return (
    <section className={styles.banda} aria-labelledby="pasos-titulo">
      <Contenedor ancho="ancho">
        <h2 id="pasos-titulo" className={styles.titulo}>
          Cómo comprar
        </h2>
        <ol className={styles.pasos}>
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className={styles.paso}>
              <span className={`${styles.numero} cifras`} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={styles.pasoTitulo}>{paso.titulo}</h3>
              <p className={styles.texto}>{paso.texto}</p>
            </li>
          ))}
        </ol>
      </Contenedor>
    </section>
  );
}
