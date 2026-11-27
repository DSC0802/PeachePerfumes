import type { Metadata } from "next";
import Contenedor from "@/components/ui/Contenedor";
import Enlace from "@/components/ui/Enlace";
import estilosAuth from "@/components/auth/FormularioAuth.module.css";
import FormularioRegistro from "@/components/auth/FormularioRegistro";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta en Peache Perfumes para comprar con sesión iniciada.",
};

export default async function PaginaRegistro({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const parametros = await searchParams;
  const next = parametros.next ?? undefined;

  return (
    <Contenedor ancho="estrecho" seccion>
      <h1>Crear cuenta</h1>
      <FormularioRegistro next={next} />
      <p className={estilosAuth.alternativa}>
        ¿Ya tienes cuenta?{" "}
        <Enlace
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        >
          Iniciar sesión
        </Enlace>
      </p>
    </Contenedor>
  );
}