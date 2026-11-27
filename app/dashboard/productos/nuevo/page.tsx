import type { Metadata } from "next";
import Link from "next/link";
import FormularioProducto from "@/components/admin/FormularioProducto";
import panel from "@/components/dashboard/Panel.module.css";
import { listarCategoriasAdmin } from "@/lib/admin/repositorio-admin";

export const metadata: Metadata = {
  title: "Nuevo producto · Panel",
};

/** /dashboard/productos/nuevo — HU-21 (alta con foto). */
export default async function PaginaNuevoProducto() {
  const categorias = await listarCategoriasAdmin();
  return (
    <>
      <header className={panel.encabezado}>
        <div>
          <p className={panel.subtitulo}>
            <Link href="/dashboard/productos">← Productos</Link>
          </p>
          <h1>Nuevo producto</h1>
        </div>
      </header>
      <FormularioProducto categorias={categorias} />
    </>
  );
}
