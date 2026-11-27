"use server";

/**
 * Server actions de pedidos (F3-D).
 * - Cliente: revisar el carrito y confirmar el pedido (exigen sesión).
 * - Panel: cambiar estado y notificaciones (exigen `requerirAdmin()`; el
 *   proxy no cubre las server actions).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerSesionActual, requerirAdmin } from "@/lib/auth/acceso";
import { obtenerWhatsappTienda } from "@/lib/ajustes/repositorio";
import { esEstadoPedido } from "./estados";
import {
  cambiarEstadoPedido,
  crearPedido,
  ErrorPedido,
  marcarNotificacion,
  marcarTodasLeidas,
  productosActuales,
} from "./repositorio";
import { normalizarLineas, revisarCarrito, type LineaCarrito, type ValeRevisado } from "./revision";

/* ------------------------------------------------------------------ cliente */

function leerLineas(valor: unknown): LineaCarrito[] {
  if (!Array.isArray(valor)) return [];
  return normalizarLineas(
    valor
      .filter((l): l is Record<string, unknown> => typeof l === "object" && l !== null)
      .map((l) => ({
        slug: String(l.slug ?? ""),
        cantidad: Number(l.cantidad),
        precioVisto: Number(l.precioVisto),
      })),
  ).slice(0, 50);
}

export interface RespuestaRevision {
  vale: ValeRevisado;
  /** La tienda tiene número de WhatsApp: se puede confirmar. */
  tiendaLista: boolean;
}

/** Revisión del carrito contra el catálogo actual (HU-31). */
export async function revisarPedido(lineasCrudas: unknown): Promise<RespuestaRevision> {
  const usuario = await obtenerSesionActual();
  if (!usuario) redirect("/login?next=/pedido");
  const lineas = leerLineas(lineasCrudas);
  const [actuales, whatsapp] = await Promise.all([
    productosActuales(lineas.map((l) => l.slug)),
    obtenerWhatsappTienda(),
  ]);
  return { vale: revisarCarrito(lineas, actuales), tiendaLista: Boolean(whatsapp) };
}

export interface EstadoConfirmacion {
  error?: string;
  vale?: ValeRevisado;
}

const MENSAJES: Record<ErrorPedido["codigo"], string> = {
  carrito_vacio: "No queda nada que pedir: los perfumes del carrito ya no están disponibles.",
  cambios: "Algo cambió mientras revisabas (precio o disponibilidad). Revisa el vale actualizado y confirma de nuevo.",
  limite_pendientes:
    "Ya tienes 3 pedidos pendientes. Cuando coordinemos alguno por WhatsApp podrás hacer otro.",
  no_encontrado: "No encontramos el pedido.",
  transicion_invalida: "Ese cambio de estado no es posible.",
};

/** Confirmar el pedido (HU-32/33): crea el pedido y lleva a su página. */
export async function confirmarPedido(
  _estado: EstadoConfirmacion,
  formData: FormData,
): Promise<EstadoConfirmacion> {
  const usuario = await obtenerSesionActual();
  if (!usuario) redirect("/login?next=/pedido");

  if (!(await obtenerWhatsappTienda())) {
    return { error: "La tienda todavía no puede recibir pedidos. Inténtalo más tarde." };
  }

  const clave = formData.get("clave")?.toString() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(clave)) return { error: "No se pudo enviar el pedido. Recarga la página." };

  let lineas: LineaCarrito[] = [];
  try {
    lineas = leerLineas(JSON.parse(formData.get("lineas")?.toString() ?? "[]"));
  } catch {
    lineas = [];
  }

  let numero: number;
  try {
    ({ numero } = await crearPedido({ usuarioId: usuario.id, lineas, clave }));
  } catch (error) {
    if (error instanceof ErrorPedido) return { error: MENSAJES[error.codigo], vale: error.vale };
    console.error("[pedidos] confirmarPedido", error);
    return { error: "No se pudo crear el pedido. Revisa la conexión e inténtalo de nuevo." };
  }

  revalidatePath("/", "layout"); // stock y disponibilidad cambiaron
  redirect(`/pedidos/${numero}?nuevo=1`);
}

/* -------------------------------------------------------------------- panel */

function destino(formData: FormData, porDefecto: string): string {
  const v = formData.get("volver")?.toString() ?? "";
  return v.startsWith("/dashboard") && !v.startsWith("//") ? v : porDefecto;
}

export async function cambiarEstadoPedidoAccion(formData: FormData): Promise<void> {
  const admin = await requerirAdmin();
  const numero = Number(formData.get("numero"));
  const hacia = formData.get("estado")?.toString();
  let aviso = "";
  if (esEstadoPedido(hacia)) {
    try {
      await cambiarEstadoPedido(numero, hacia, admin.id);
    } catch (error) {
      if (!(error instanceof ErrorPedido)) throw error;
      aviso = `?aviso=${error.codigo}`;
    }
  }
  revalidatePath("/", "layout");
  redirect(destino(formData, `/dashboard/pedidos/${numero}`) + aviso);
}

export async function marcarNotificacionAccion(formData: FormData): Promise<void> {
  await requerirAdmin();
  await marcarNotificacion(formData.get("id")?.toString() ?? "", formData.get("leida") === "1");
  revalidatePath("/dashboard", "layout");
  redirect(destino(formData, "/dashboard/notificaciones"));
}

export async function marcarTodasLeidasAccion(): Promise<void> {
  await requerirAdmin();
  await marcarTodasLeidas();
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/notificaciones");
}
