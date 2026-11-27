"use server";

/** Acción del panel: número de WhatsApp de la tienda (F3-D, spec §3). */
import { revalidatePath } from "next/cache";
import { requerirAdmin } from "@/lib/auth/acceso";
import { validarNumero } from "@/lib/pedidos/whatsapp";
import { CLAVE_WHATSAPP, guardarAjuste } from "./repositorio";

export interface EstadoFormularioWhatsapp {
  error?: string;
  ok?: string;
  valor?: string;
}

export async function guardarWhatsappAccion(
  _estado: EstadoFormularioWhatsapp,
  formData: FormData,
): Promise<EstadoFormularioWhatsapp> {
  await requerirAdmin();
  const valor = formData.get("whatsapp")?.toString() ?? "";
  const resultado = validarNumero(valor);
  if (!resultado.ok) return { error: resultado.error, valor };
  try {
    await guardarAjuste(CLAVE_WHATSAPP, resultado.numero);
  } catch (error) {
    console.error("[ajustes] guardarWhatsapp", error);
    return { error: "No se pudo guardar el número. Revisa la conexión con la base de datos.", valor };
  }
  revalidatePath("/", "layout");
  return { ok: `Número guardado: +${resultado.numero}. Los pedidos llegarán a ese WhatsApp.`, valor: resultado.numero };
}
