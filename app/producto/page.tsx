import { redirect } from "next/navigation";

/**
 * `/producto` (arquitectura §5.1, mapa de rutas): la ficha vive en
 * `/producto/[slug]`; este prefijo redirige al catálogo para que un tecleo
 * directo (o un enlace viejo) no acabe en un 404 de ruta.
 */
export default function PaginaProducto() {
  redirect("/catalogo");
}
