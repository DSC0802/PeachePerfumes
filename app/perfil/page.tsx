import type { Metadata } from "next";
import { cookies } from "next/headers";
import Contenedor from "@/components/ui/Contenedor";
import FormularioPerfil from "@/components/auth/FormularioPerfil";
import { obtenerSesionActual } from "@/lib/auth/acceso";
import { NOMBRE_COOKIE } from "@/lib/auth/constantes";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Gestiona tus datos personales en Peache Perfumes.",
};

export default async function PaginaPerfil({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const parametros = await searchParams;
  const guardado = parametros.guardado === "1";

  const cookieStore = await cookies();
  const tieneCookie = cookieStore.get(NOMBRE_COOKIE)?.value;
  const usuario = await obtenerSesionActual();

  if (!usuario) {
    const aviso = tieneCookie ? "&aviso=expirada" : "";
    const { redirect } = await import("next/navigation");
    redirect(`/login?next=/perfil${aviso}`);
    return null;
  }

  return (
    <Contenedor ancho="estrecho" seccion>
      <h1>Mi perfil</h1>
      <FormularioPerfil
        email={usuario.email}
        nombre={usuario.nombre}
        telefono={usuario.telefono}
        guardado={guardado}
      />
    </Contenedor>
  );
}