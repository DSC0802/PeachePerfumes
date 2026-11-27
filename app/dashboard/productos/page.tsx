import type { Metadata } from "next";
import Link from "next/link";
import FormularioConfirmado from "@/components/admin/FormularioConfirmado";
import tabla from "@/components/admin/TablaProductos.module.css";
import AvisoFuenteDemo from "@/components/dashboard/AvisoFuenteDemo";
import panel from "@/components/dashboard/Panel.module.css";
import Boton from "@/components/ui/Boton";
import Etiqueta from "@/components/ui/Etiqueta";
import MarcoImagen from "@/components/ui/MarcoImagen";
import Precio from "@/components/ui/Precio";
import { alternarOculto, cambiarEstadoProducto } from "@/lib/admin/acciones";
import { NOMBRE_ESTADO } from "@/lib/admin/metricas";
import { listarCategoriasAdmin, listarProductosAdmin } from "@/lib/admin/repositorio-admin";
import { ESTADOS_PRODUCTO, UMBRAL_STOCK_BAJO, type EstadoProducto } from "@/lib/admin/tipos";

export const metadata: Metadata = {
  title: "Productos · Panel",
};

/** /dashboard/productos — HU-20…24: lista, filtros y acciones por fila. */
export default async function PaginaProductosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; ocultos?: string; guardado?: string }>;
}) {
  const parametros = await searchParams;
  const q = parametros.q?.trim() ?? "";
  const estado = ESTADOS_PRODUCTO.includes(parametros.estado as EstadoProducto)
    ? (parametros.estado as EstadoProducto)
    : undefined;
  const incluirOcultos = parametros.ocultos === "1";

  const [productos, categorias] = await Promise.all([
    listarProductosAdmin({ q, estado, incluirOcultos }),
    listarCategoriasAdmin(),
  ]);
  const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]));
  const guardado = parametros.guardado
    ? productos.find((p) => p.id === parametros.guardado)
    : undefined;

  // Tras ocultar/restaurar/cambiar estado se vuelve a la misma vista filtrada.
  const consulta = new URLSearchParams();
  if (q) consulta.set("q", q);
  if (estado) consulta.set("estado", estado);
  if (incluirOcultos) consulta.set("ocultos", "1");
  const volver = `/dashboard/productos${consulta.size ? `?${consulta}` : ""}`;
  const hayFiltros = Boolean(q || estado || incluirOcultos);

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <h1>Productos</h1>
          <p className={panel.subtitulo}>
            {productos.length} {productos.length === 1 ? "producto" : "productos"}
            {hayFiltros ? " con estos filtros" : incluirOcultos ? "" : " visibles"}
          </p>
        </div>
        <Boton href="/dashboard/productos/nuevo">Nuevo producto</Boton>
      </header>

      <AvisoFuenteDemo />
      {parametros.guardado ? (
        <p className={panel.exito} role="status">
          {guardado ? `«${guardado.nombre}» se guardó correctamente.` : "Producto guardado."}
        </p>
      ) : null}

      <form className={tabla.filtros} method="get" role="search" aria-label="Filtrar productos">
        <div className={tabla.campo}>
          <label htmlFor="filtro-q">Buscar</label>
          <input id="filtro-q" name="q" type="search" defaultValue={q} placeholder="Nombre, marca o slug" />
        </div>
        <div className={tabla.campo}>
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" name="estado" defaultValue={estado ?? ""}>
            <option value="">Todos</option>
            {ESTADOS_PRODUCTO.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO[e]}
              </option>
            ))}
          </select>
        </div>
        <label className={tabla.casilla}>
          <input type="checkbox" name="ocultos" value="1" defaultChecked={incluirOcultos} />
          Incluir ocultos
        </label>
        <div className={tabla.acciones}>
          <Boton type="submit" variante="secundario">
            Filtrar
          </Boton>
          {hayFiltros ? <Link href="/dashboard/productos">Quitar filtros</Link> : null}
        </div>
      </form>

      <section className={panel.tarjeta} aria-label="Listado de productos">
        {productos.length === 0 ? (
          <p className={panel.vacio}>
            {hayFiltros ? "Ningún producto coincide con estos filtros." : "Todavía no hay productos."}
          </p>
        ) : (
          <div className={panel.tablaContenedor}>
            <table className={`${panel.tabla} ${tabla.apilada}`}>
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col" className={panel.num}>
                    Precio
                  </th>
                  <th scope="col" className={panel.num}>
                    Stock
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">Visibilidad</th>
                  <th scope="col">
                    <span className="solo-lectura">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} className={p.oculto ? tabla.filaOculta : undefined}>
                    <th scope="row">
                      <span className={tabla.producto}>
                        <MarcoImagen
                          variante="tarjeta"
                          className={tabla.miniatura}
                          imagen={p.imagenSrc ? { src: p.imagenSrc, alt: "" } : undefined}
                          sizes="48px"
                        />
                        <span>
                          {p.nombre}
                          <span className={panel.secundario}>
                            {p.marca} · {p.tamanoMl} ml
                          </span>
                        </span>
                      </span>
                    </th>
                    <td>{nombreCategoria.get(p.categoriaId) ?? p.categoriaId}</td>
                    <td className={panel.num}>
                      <Precio valor={p.precioUsd} variante="nota" />
                    </td>
                    <td className={panel.num}>
                      {p.stock <= UMBRAL_STOCK_BAJO ? (
                        <strong className={tabla.stockBajo}>
                          {p.stock}
                          <span className="solo-lectura"> (stock bajo)</span>
                        </strong>
                      ) : (
                        p.stock
                      )}
                    </td>
                    <td>
                      <form action={cambiarEstadoProducto} className={tabla.estadoForm}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="volver" value={volver} />
                        <label className="solo-lectura" htmlFor={`estado-${p.id}`}>
                          Nuevo estado de {p.nombre}
                        </label>
                        <select id={`estado-${p.id}`} name="estado" defaultValue={p.estado}>
                          {ESTADOS_PRODUCTO.map((e) => (
                            <option key={e} value={e}>
                              {NOMBRE_ESTADO[e]}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className={tabla.botonTexto}>
                          Aplicar<span className="solo-lectura"> estado a {p.nombre}</span>
                        </button>
                      </form>
                    </td>
                    <td className={tabla.nowrap}>
                      {p.oculto ? (
                        <Etiqueta variante="neutral">Oculto</Etiqueta>
                      ) : (
                        <Etiqueta variante="info">En tienda</Etiqueta>
                      )}
                    </td>
                    <td>
                      <span className={tabla.filaAcciones}>
                        <Link href={`/dashboard/productos/${p.id}/editar`}>
                          Editar<span className="solo-lectura"> {p.nombre}</span>
                        </Link>
                        {p.oculto ? (
                          <form action={alternarOculto}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="ocultar" value="0" />
                            <input type="hidden" name="volver" value={volver} />
                            <button type="submit" className={tabla.botonTexto}>
                              Restaurar<span className="solo-lectura"> {p.nombre}</span>
                            </button>
                          </form>
                        ) : (
                          <FormularioConfirmado
                            accion={alternarOculto}
                            mensaje={`¿Quitar «${p.nombre}» de la tienda? Se ocultará, pero podrás restaurarlo desde aquí.`}
                          >
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="ocultar" value="1" />
                            <input type="hidden" name="volver" value={volver} />
                            <button type="submit" className={`${tabla.botonTexto} ${tabla.peligro}`}>
                              Quitar<span className="solo-lectura"> {p.nombre} de la tienda</span>
                            </button>
                          </FormularioConfirmado>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
