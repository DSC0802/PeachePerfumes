"use server";

/**
 * Server actions del panel admin (F3-C).
 * El proxy NO protege las server actions (se invocan por POST a cualquier
 * ruta): por eso CADA acción empieza con `requerirAdmin()`.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirAdmin } from "@/lib/auth/acceso";
import { borrarImagen, guardarImagen } from "./imagenes";
import {
  actualizarProducto,
  cambiarEstado,
  crearProducto,
  establecerOculto,
  listarCategoriasAdmin,
  obtenerProductoAdmin,
  slugEnUso,
} from "./repositorio-admin";
import { ESTADOS_PRODUCTO, type EstadoFormularioProducto, type EstadoProducto } from "./tipos";
import { validarProducto } from "./validacion-producto";

const CAMPOS_TEXTO = [
  "id",
  "nombre",
  "marca",
  "slug",
  "precioUsd",
  "tamanoMl",
  "stock",
  "categoriaId",
  "familia",
  "estado",
  "descripcion",
  "notasSalida",
  "notasCorazon",
  "notasFondo",
  "imagenAlt",
  "destacado",
  "novedad",
] as const;

/** Las páginas son dinámicas: invalidar el layout raíz refresca tienda y panel. */
function refrescarTodo(): void {
  revalidatePath("/", "layout");
}

export async function guardarProducto(
  _estado: EstadoFormularioProducto,
  formData: FormData,
): Promise<EstadoFormularioProducto> {
  await requerirAdmin();

  const valores: Record<string, string> = {};
  for (const campo of CAMPOS_TEXTO) {
    const v = formData.get(campo);
    if (typeof v === "string") valores[campo] = v;
  }
  const id = valores.id || undefined;

  const existente = id ? await obtenerProductoAdmin(id) : null;
  if (id && !existente) return { error: "El producto ya no existe.", valores };

  const categorias = await listarCategoriasAdmin();
  const resultado = validarProducto(valores, categorias.map((c) => c.id));
  if (!resultado.ok) return { errores: resultado.errores, valores };
  const datos = resultado.datos;

  const archivo = formData.get("imagen");
  const hayArchivo = archivo instanceof File && archivo.size > 0;
  const quitarImagen = formData.get("quitarImagen") === "on";
  const tendraImagen = hayArchivo || (Boolean(existente?.imagenSrc) && !quitarImagen);
  if (tendraImagen && !datos.imagenAlt) {
    return {
      errores: { imagenAlt: "Describe la foto para lectores de pantalla (p. ej. «Frasco de 100 ml sobre fondo arena»)." },
      valores,
    };
  }

  if (await slugEnUso(datos.slug, id)) {
    return { errores: { slug: "Ya hay otro producto con esa URL. Cambia el slug." }, valores };
  }

  let imagenNueva: string | undefined;
  if (hayArchivo) {
    const subida = await guardarImagen(archivo);
    if (!subida.ok) return { errores: { imagen: subida.error }, valores };
    imagenNueva = subida.src;
  } else if (quitarImagen) {
    imagenNueva = "";
  }

  let guardadoId: string;
  try {
    if (existente) {
      await actualizarProducto(existente.id, datos, imagenNueva);
      if (imagenNueva !== undefined && existente.imagenSrc !== imagenNueva) {
        await borrarImagen(existente.imagenSrc);
      }
      guardadoId = existente.id;
    } else {
      const creado = await crearProducto(datos, imagenNueva ?? "");
      guardadoId = creado.id;
    }
  } catch (error) {
    if (imagenNueva) await borrarImagen(imagenNueva); // no dejar huérfanos
    console.error("[admin] guardarProducto", error);
    return { error: "No se pudo guardar. Revisa la conexión con la base de datos e inténtalo de nuevo.", valores };
  }

  refrescarTodo();
  redirect(`/dashboard/productos?guardado=${guardadoId}`);
}

function destinoSeguro(formData: FormData): string {
  const destino = formData.get("volver")?.toString() ?? "";
  return destino.startsWith("/dashboard") && !destino.startsWith("//") ? destino : "/dashboard/productos";
}

/** Ocultar («Eliminar» del panel, HU-23) o restaurar. */
export async function alternarOculto(formData: FormData): Promise<void> {
  await requerirAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const ocultar = formData.get("ocultar") === "1";
  await establecerOculto(id, ocultar);
  refrescarTodo();
  redirect(destinoSeguro(formData));
}

export async function cambiarEstadoProducto(formData: FormData): Promise<void> {
  await requerirAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const estado = formData.get("estado")?.toString() as EstadoProducto;
  if (ESTADOS_PRODUCTO.includes(estado)) {
    await cambiarEstado(id, estado);
    refrescarTodo();
  }
  redirect(destinoSeguro(formData));
}
