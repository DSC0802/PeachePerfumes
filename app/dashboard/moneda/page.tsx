import { redirect } from "next/navigation";

/** La tasa vive ahora en «Ajustes» (F3-D); se conserva la ruta antigua. */
export default function PaginaMonedaAntigua() {
  redirect("/dashboard/ajustes");
}
