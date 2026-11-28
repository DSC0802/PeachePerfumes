import Contenedor from "@/components/ui/Contenedor";
import Enlace from "@/components/ui/Enlace";
import Marca from "@/components/ui/Marca";
import { IconoRedSocial } from "@/components/ui/IconoRedSocial";
import styles from "./PiePagina.module.css";

/**
 * Pie de página profesional — Peache Perfumes.
 *
 * Bloques (móvil: apilado; desktop: 4 columnas):
 * 1. Marca + descripción
 * 2. Contacto (dirección, horario)
 * 3. Navegación principal
 * 4. Redes sociales con iconos SVG
 * 5. Copyright + crédito Sueiro Dev (ancho completo, debajo)
 *
 * Reglas del sistema de diseño: filetes en vez de cajas, esquinas rectas,
 * rosa de marca sólo en acción principal y logotipo, versalitas espaciadas.
 */
const ENLACES_NAV = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/catalogo", etiqueta: "Catálogo" },
  { href: "/pedidos", etiqueta: "Mis pedidos" },
  { href: "/perfil", etiqueta: "Mi perfil" },
];

// Redes sociales del administrador.
// Reemplaza las URLs vacías con los enlaces reales cuando estén disponibles.
const REDES_SOCIALES: { nombre: string; icono: "instagram" | "facebook" | "whatsapp"; url: string }[] = [
  { nombre: "Instagram", icono: "instagram", url: "" },
  { nombre: "Facebook", icono: "facebook", url: "" },
  { nombre: "WhatsApp", icono: "whatsapp", url: "" },
];

export default function PiePagina() {
  return (
    <footer className={styles.pie}>
      <Contenedor ancho="ancho" className={styles.interior}>
        <div className={styles.bloque}>
          <div className={styles.marca}>
            <Marca />
          </div>
          <p className={styles.descripcion}>
            Perfumes originales en Cuba. Pagas en efectivo al recibirlos.
          </p>
        </div>

        <div className={styles.bloque}>
          <h4 className={styles.tituloBloque}>Contacto</h4>
          <address className={styles.direccion}>
            Calle Línea e/ calle 20 y calle 22<br />
            Vedado, La Habana
          </address>
          <p className={styles.horario}>
            <span className={styles.etiqueta}>Horario:</span>
            Lunes a sábado 10:00 a. m. – 5:00 p. m.
          </p>
        </div>

        <div className={styles.bloque}>
          <h4 className={styles.tituloBloque}>Navegación</h4>
          <ul className={styles.enlaces}>
            {ENLACES_NAV.map(({ href, etiqueta }) => (
              <li key={href}>
                <Enlace href={href}>{etiqueta}</Enlace>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.bloque}>
          <h4 className={styles.tituloBloque}>Síguenos</h4>
          <ul className={styles.redes}>
            {REDES_SOCIALES.map((red) => (
              <li key={red.nombre}>
                <Enlace
                  href={red.url || "#"}
                  className={styles.enlaceRed}
                  aria-label={red.nombre}
                >
                  <span className={styles.icono}>
                    <IconoRedSocial red={red.icono} />
                  </span>
                  {red.nombre}
                </Enlace>
              </li>
            ))}
          </ul>
        </div>
      </Contenedor>

      <div className={styles.colofon}>
        <Contenedor ancho="ancho" className={styles.colofonInterior}>
          <p className={styles.copyright}>
            © 2026 Peache Perfumes. Todos los derechos reservados.
          </p>
          <p className={styles.credito}>
            Página creada por <strong>Sueiro Dev</strong>
          </p>
        </Contenedor>
      </div>
    </footer>
  );
}
