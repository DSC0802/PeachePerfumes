import Precio from "@/components/ui/Precio";
import type { ProductoAdmin } from "@/lib/admin/tipos";
import panel from "./Panel.module.css";

interface FilaTop {
  producto: ProductoAdmin;
  valor: number;
}

/**
 * Top 5 por valor de inventario (precio × stock). Adaptación del antiguo
 * «Productos más vendidos»: sin pedidos (F3-D) no hay ventas que ordenar.
 */
export default function TopValorInventario({ top }: { top: FilaTop[] }) {
  const maximo = Math.max(0, ...top.map((t) => t.valor));
  return (
    <section className={panel.tarjeta} aria-labelledby="titulo-top-valor">
      <div className={panel.tarjeta__cabecera}>
        <h2 id="titulo-top-valor" className={panel.tarjeta__titulo}>
          Mayor valor en inventario
        </h2>
        <p className={panel.tarjeta__nota}>precio × unidades en stock</p>
      </div>
      {top.length === 0 ? (
        <p className={panel.vacio}>Todavía no hay productos con stock.</p>
      ) : (
        <div className={panel.tablaContenedor} tabIndex={0} role="region" aria-labelledby="titulo-top-valor">
          <table className={panel.tabla}>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col" className={panel.num}>
                  Precio
                </th>
                <th scope="col" className={panel.num}>
                  Stock
                </th>
                <th scope="col" className={panel.num}>
                  Valor
                </th>
                <th scope="col">
                  <span className="solo-lectura">Proporción</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {top.map(({ producto, valor }) => (
                <tr key={producto.id}>
                  <th scope="row">{producto.nombre}</th>
                  <td className={panel.num}>
                    <Precio valor={producto.precioUsd} variante="nota" />
                  </td>
                  <td className={panel.num}>{producto.stock}</td>
                  <td className={panel.num}>
                    <Precio valor={valor} variante="nota" />
                  </td>
                  <td style={{ minWidth: "5rem" }} aria-hidden="true">
                    <span className={panel.barra}>
                      <span
                        className={panel.barra__relleno}
                        style={{ width: `${maximo ? (valor / maximo) * 100 : 0}%` }}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
