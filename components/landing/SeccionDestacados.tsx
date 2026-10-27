import Boton from "@/components/ui/Boton";
import EstadoVacio from "@/components/ui/EstadoVacio";
import RejillaCatalogo from "@/components/catalogo/RejillaCatalogo";
import SkeletonTarjeta from "@/components/catalogo/SkeletonTarjeta";
import TarjetaProducto from "@/components/catalogo/TarjetaProducto";
import type { DatosTarjeta } from "@/components/catalogo/TarjetaProducto";
import styles from "./SeccionDestacados.module.css";

/** Estados de la sección de destacados (estados §3.1). */
export type EstadoDestacados = "listo" | "cargando" | "vacio" | "error";

export interface SeccionDestacadosProps {
  productos?: DatosTarjeta[];
  estado?: EstadoDestacados;
  /** Título de la sección: siempre visible, incluso cargando (§3.1). */
  titulo?: string;
  /**
   * Id del `h2`, único por sección: la portada renderiza dos (destacados y
   * novedades) y dos ids iguales romperían `aria-labelledby`.
   */
  idTitulo?: string;
  /** Acción del estado de error (§4.3: "Reintentar"). */
  onReintentar?: () => void;
  className?: string;
}

const CANTIDAD_SKELETONS = 4;

export default function SeccionDestacados({
  productos = [],
  estado = "listo",
  titulo = "Destacados",
  idTitulo = "destacados-titulo",
  onReintentar,
  className,
}: SeccionDestacadosProps) {
  const vacio = estado === "vacio" || (estado === "listo" && productos.length === 0);
  const clases = [styles.seccion, className].filter(Boolean).join(" ");

  return (
    <section className={clases} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={styles.titulo}>
        {titulo}
      </h2>

      {estado === "cargando" ? (
        <div aria-busy="true" className={styles.rejillaContenedora}>
          <span className="solo-lectura">Cargando…</span>
          <RejillaCatalogo>
            {Array.from({ length: CANTIDAD_SKELETONS }, (_, i) => (
              <SkeletonTarjeta key={i} />
            ))}
          </RejillaCatalogo>
        </div>
      ) : null}

      {estado === "error" ? (
        <EstadoVacio
          nivelTitulo="h3"
          titulo="No pudimos cargar el catálogo."
          apoyo="Revisa tu conexión e inténtalo de nuevo."
        >
          {onReintentar ? (
            <Boton variante="secundario" onClick={onReintentar}>
              Reintentar
            </Boton>
          ) : null}
        </EstadoVacio>
      ) : null}

      {vacio ? (
        <EstadoVacio
          nivelTitulo="h3"
          titulo="Aún no hay novedades"
          apoyo="La primera selección estará disponible muy pronto."
        >
          <Boton variante="secundario" href="/catalogo">
            Ver el catálogo
          </Boton>
        </EstadoVacio>
      ) : null}

      {estado === "listo" && productos.length > 0 ? (
        <RejillaCatalogo>
          {productos.map((producto) => (
            <TarjetaProducto key={producto.slug} producto={producto} />
          ))}
        </RejillaCatalogo>
      ) : null}
    </section>
  );
}
