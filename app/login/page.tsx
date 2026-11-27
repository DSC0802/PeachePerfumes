import type { Metadata } from "next";
import Contenedor from "@/components/ui/Contenedor";
import Enlace from "@/components/ui/Enlace";
import estilosAuth from "@/components/auth/FormularioAuth.module.css";
import FormularioLogin from "@/components/auth/FormularioLogin";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Inicia sesión en tu cuenta de Peache Perfumes.",
};

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; aviso?: string }>;
}) {
  const parametros = await searchParams;
  const next = parametros.next ?? undefined;
  const sesionCaducada = parametros.aviso === "expirada";

  return (
    <Contenedor ancho="estrecho" seccion>
      <h1>Iniciar sesión</h1>
      {sesionCaducada ? (
        <p role="status">Tu sesión ha caducado. Inicia sesión de nuevo.</p>
      ) : null}
      <FormularioLogin next={next} />
      <p className={estilosAuth.alternativa}>
        ¿Aún no tienes cuenta?{" "}
        <Enlace
          href={next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"}
        >
          Crear cuenta
        </Enlace>
      </p>
    </Contenedor>
  );
}