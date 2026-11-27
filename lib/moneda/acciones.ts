"use server";

/**
 * Acción del panel para fijar la tasa CUP por 1 USD (F3-C2, HU-52).
 * Como todas las acciones del panel, verifica `requerirAdmin()` (el proxy no
 * cubre las server actions).
 */
import { revalidatePath } from "next/cache";
import { requerirAdmin } from "@/lib/auth/acceso";
import { validarTasa } from "./conversion";
import { guardarTasa } from "./repositorio";

export interface EstadoFormularioTasa {
  error?: string;
  ok?: string;
  valor?: string;
}

export async function guardarTasaAccion(
  _estado: EstadoFormularioTasa,
  formData: FormData,
): Promise<EstadoFormularioTasa> {
  const admin = await requerirAdmin();
  const valor = formData.get("tasa")?.toString() ?? "";
  const resultado = validarTasa(valor);
  if (!resultado.ok) return { error: resultado.error, valor };

  try {
    await guardarTasa(resultado.tasa, admin.id);
  } catch (error) {
    console.error("[moneda] guardarTasa", error);
    return { error: "No se pudo guardar la tasa. Revisa la conexión con la base de datos.", valor };
  }

  // La tasa afecta a toda la tienda (precios en CUP) y al propio panel.
  revalidatePath("/", "layout");
  return { ok: `Tasa guardada: 1 USD = ${resultado.tasa} CUP.` };
}
