import { usdACup } from "@/lib/moneda/conversion";
import { formatearImporte } from "@/lib/moneda/formato";
import panel from "./Panel.module.css";

/**
 * Importe de los reportes (F3-E, decisión del cliente): USD, la moneda de
 * cuentas, y debajo su equivalente en CUP con la tasa vigente.
 */
export default function ImporteDoble({
  usd,
  tasa,
  className,
}: {
  usd: number;
  tasa: number | null;
  className?: string;
}) {
  return (
    <span className={className}>
      <data value={usd.toFixed(2)} className="cifras">
        {formatearImporte(usd, "USD")}
      </data>
      {tasa !== null ? (
        <span className={panel.secundario}>≈ {formatearImporte(usdACup(usd, tasa), "CUP")}</span>
      ) : null}
    </span>
  );
}
