/**
 * Proxy de Next 16 (middleware deprecado y renombrado a proxy.ts).
 * Protege /dashboard con 403 real para no-admin (spec F3-B §6).
 * Verificado en node_modules/next/dist/docs/.../proxy.md.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buscarSesionValida } from "@/lib/auth/sesiones";
import { pagina403 } from "@/lib/auth/pagina-403";
import { NOMBRE_COOKIE } from "@/lib/auth/constantes";

export async function proxy(request: NextRequest) {
  // Short-circuit: si no hay cookie, no toca la BD
  const token = request.cookies.get(NOMBRE_COOKIE)?.value;
  if (!token) {
    return new Response(pagina403(), {
      status: 403,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex",
      },
    });
  }

  const usuario = await buscarSesionValida(token);
  if (!usuario || usuario.rol !== "admin") {
    return new Response(pagina403(), {
      status: 403,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};