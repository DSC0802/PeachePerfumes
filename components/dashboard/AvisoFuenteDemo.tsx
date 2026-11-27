import { tiendaUsaDemo } from "@/lib/admin/datos-panel";
import panel from "./Panel.module.css";

/** Aviso visible si la tienda lee el catálogo demo: los cambios del panel no se verán en ella. */
export default function AvisoFuenteDemo() {
  if (!tiendaUsaDemo()) return null;
  return (
    <p className={panel.aviso} role="note">
      La tienda está leyendo el catálogo de demostración (<code>FUENTE_CATALOGO=demo</code>). Los
      cambios que hagas aquí se guardan en PostgreSQL, pero no se verán en la tienda hasta poner{" "}
      <code>FUENTE_CATALOGO=postgres</code> en <code>.env.local</code>.
    </p>
  );
}
