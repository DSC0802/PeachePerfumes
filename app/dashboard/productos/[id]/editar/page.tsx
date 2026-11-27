import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormularioProducto from "@/components/admin/FormularioProducto";
import panel from "@/components/dashboard/Panel.module.css";
import { listarCategoriasAdmin, obtenerProductoAdmin } from "@/lib/admin/repositorio-admin";

export const metadata: Metadata = {
  title: "Editar producto · Panel",
};

/** /dashboard/productos/[id]/editar — HU-22 (editar cualquier campo, foto incluida). */
export default async function PaginaEditarProducto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [producto, categorias] = await Promise.all([obtenerProductoAdmin(id), listarCategoriasAdmin()]);
  if (!producto) notFound();

  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <p className={panel.subtitulo}>
            <Link href="/dashboard/productos">← Productos</Link>
          </p>
          <h1>Editar «{producto.nombre}»</h1>
          <p className={panel.subtitulo}>
            {producto.oculto ? "Oculto en la tienda." : "Visible en la tienda."}{" "}
            {producto.oculto ? null : <Link href={`/producto/${producto.slug}`}>Ver ficha pública</Link>}
          </p>
        </div>
      </header>
      <FormularioProducto categorias={categorias} producto={producto} />
    </>
  );
}
