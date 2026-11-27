import Link from "next/link";
import Etiqueta from "@/components/ui/Etiqueta";
import type { ProductoAdmin } from "@/lib/admin/tipos";
import { UMBRAL_STOCK_BAJO } from "@/lib/admin/tipos";
import panel from "./Panel.module.css";

/** Productos a reponer (F3-C). Adaptación del antiguo InventarioResumen, con datos reales. */
export default function TablaStockBajo({ productos }: { productos: ProductoAdmin[] }) {
  return (
    <section className={panel.tarjeta} aria-labelledby="titulo-stock-bajo">
      <div className={panel.tarjeta__cabecera}>
        <h2 id="titulo-stock-bajo" className={panel.tarjeta__titulo}>
          Stock bajo
        </h2>
        <p className={panel.tarjeta__nota}>≤ {UMBRAL_STOCK_BAJO} unidades, productos a la venta</p>
      </div>
      {productos.length === 0 ? (
        <p className={panel.vacio}>Todo el catálogo tiene stock suficiente.</p>
      ) : (
        <div className={panel.tablaContenedor}>
          <table className={panel.tabla}>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col" className={panel.num}>
                  Stock
                </th>
                <th scope="col">Situación</th>
                <th scope="col">
                  <span className="solo-lectura">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <th scope="row">
                    {p.nombre}
                    <span className={panel.secundario}>{p.marca}</span>
                  </th>
                  <td className={panel.num}>{p.stock}</td>
                  <td>
                    {p.stock === 0 ? (
                      <Etiqueta variante="error">Sin stock</Etiqueta>
                    ) : (
                      <Etiqueta variante="neutral">Reponer pronto</Etiqueta>
                    )}
                  </td>
                  <td className={panel.num}>
                    <Link href={`/dashboard/productos/${p.id}/editar`}>
                      Editar<span className="solo-lectura"> {p.nombre}</span>
                    </Link>
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
