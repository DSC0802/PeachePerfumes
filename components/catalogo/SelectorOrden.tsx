import type { OrdenCatalogo } from "@/lib/catalogo";
import campo from "@/components/ui/CampoTexto.module.css";
import { OPCIONES_ORDEN } from "./ordenes";

/**
 * Selector «Ordenar» (estados §2.1.3): `<select>` **nativo** con el aspecto
 * del sistema (decisión D-SELECT) y la base de estilos de `CampoTexto` (§2 de
 * `componentes.md`: etiqueta arriba → control; aquí sin `appearance` propia, la
 * flecha es la del sistema). Presentacional: el panel cliente escribe `?orden=`
 * en la URL.
 */
export interface SelectorOrdenProps {
  valor: OrdenCatalogo;
  onChange: (orden: OrdenCatalogo) => void;
}

export default function SelectorOrden({ valor, onChange }: SelectorOrdenProps) {
  return (
    <div className={campo.campo}>
      <label className={campo.etiqueta} htmlFor="orden">
        Ordenar
      </label>
      <select
        id="orden"
        name="orden"
        className={campo.control}
        value={valor}
        onChange={(evento) => onChange(evento.target.value as OrdenCatalogo)}
      >
        {OPCIONES_ORDEN.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
