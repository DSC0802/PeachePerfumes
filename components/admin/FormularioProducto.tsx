"use client";

import { startTransition, useActionState, useEffect, useState, type ReactNode } from "react";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { guardarProducto } from "@/lib/admin/acciones";
import type { Categoria } from "@/lib/catalogo/tipos";
import type { CampoProducto, EstadoFormularioProducto, ProductoAdmin } from "@/lib/admin/tipos";
import { generarSlug } from "@/lib/admin/validacion-producto";
import auth from "@/components/auth/FormularioAuth.module.css";
import styles from "./FormularioProducto.module.css";

const FAMILIAS = [
  ["citrico", "Cítrico"],
  ["floral", "Floral"],
  ["amaderado", "Amaderado"],
  ["oriental", "Oriental"],
  ["frutal", "Frutal"],
  ["acuatico", "Acuático"],
  ["gourmand", "Gourmand"],
] as const;

const ESTADOS = [
  ["activo", "Activo — a la venta"],
  ["agotado", "Agotado — visible, sin stock"],
  ["descontinuado", "Descontinuado"],
] as const;

function BotonGuardar({ editando, pending }: { editando: boolean; pending: boolean }) {
  return (
    <Boton type="submit" loading={pending} disabled={pending}>
      {pending ? "Guardando…" : editando ? "Guardar cambios" : "Crear producto"}
    </Boton>
  );
}

/** Contenedor de campo con etiqueta, ayuda y error (select/textarea/archivo). */
function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
}) {
  const describedBy = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      {children(describedBy || undefined)}
      {ayuda ? (
        <p id={`${id}-ayuda`} className={styles.ayuda}>
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Alta y edición de productos con foto (F3-C, HU-21/22/25). */
export default function FormularioProducto({
  categorias,
  producto,
}: {
  categorias: Categoria[];
  producto?: ProductoAdmin;
}) {
  const [estado, accion, guardando] = useActionState<EstadoFormularioProducto, FormData>(
    guardarProducto,
    {},
  );
  const errores = estado.errores ?? {};
  const v = estado.valores;
  const editando = Boolean(producto);

  /** Valor inicial: lo tecleado (tras un error) o el del producto. */
  const inicial = (campo: string, delProducto: string | number | undefined, porDefecto = "") =>
    v?.[campo] ?? (delProducto !== undefined ? String(delProducto) : porDefecto);
  const marcado = (campo: "destacado" | "novedad") =>
    v ? v[campo] === "on" : Boolean(producto?.[campo]);

  const [nombre, setNombre] = useState(inicial("nombre", producto?.nombre));
  const slugInicial = inicial("slug", producto?.slug);
  // Al crear, el slug sigue al nombre hasta que el admin lo edite a mano.
  const [slugManual, setSlugManual] = useState<string | null>(editando || slugInicial ? slugInicial : null);
  const slug = slugManual ?? generarSlug(nombre);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  useEffect(() => () => {
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
  }, [vistaPrevia]);

  const error = (campo: CampoProducto) => errores[campo];
  const imagenActual = producto?.imagenSrc || null;
  const hayErrores = Object.keys(errores).length > 0;

  return (
    <form
      action={accion}
      className={styles.formulario}
      noValidate
      onSubmit={(evento) => {
        // Envío manual: con `action` a secas, React 19 resetea el formulario al
        // terminar y, tras un error de validación, se perdían la foto elegida
        // (la vista previa seguía visible), la categoría y la familia.
        // Sin JS, el formulario sigue enviándose por `action`.
        evento.preventDefault();
        const datos = new FormData(evento.currentTarget);
        startTransition(() => accion(datos));
      }}
    >
      {producto ? <input type="hidden" name="id" value={producto.id} /> : null}

      {estado.error ? (
        <p className={auth.errorFormulario} role="alert">
          {estado.error}
        </p>
      ) : null}
      {hayErrores ? (
        <p className={auth.errorFormulario} role="alert">
          Revisa los campos marcados.
        </p>
      ) : null}

      <fieldset className={styles.grupo}>
        <legend>Datos básicos</legend>
        <div className={styles.columnas}>
          <CampoTexto
            id="nombre"
            name="nombre"
            etiqueta="Nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={error("nombre")}
          />
          <CampoTexto
            id="marca"
            name="marca"
            etiqueta="Marca"
            required
            defaultValue={inicial("marca", producto?.marca, "Peache Perfumes")}
            error={error("marca")}
          />
        </div>
        <CampoTexto
          id="slug"
          name="slug"
          etiqueta="Dirección en la tienda (slug)"
          ayuda={`Se genera a partir del nombre. URL: /producto/${slug || "…"}`}
          value={slug}
          onChange={(e) => setSlugManual(e.target.value)}
          error={error("slug")}
          spellCheck={false}
          autoCapitalize="off"
        />
        <Campo id="descripcion" etiqueta="Descripción" error={error("descripcion")}>
          {(describedBy) => (
            <textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              required
              className={styles.control}
              defaultValue={inicial("descripcion", producto?.descripcion)}
              aria-invalid={error("descripcion") ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </Campo>
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend>Precio, tamaño y stock</legend>
        <div className={styles.columnas3}>
          <CampoTexto
            id="precioUsd"
            name="precioUsd"
            etiqueta="Precio (USD)"
            inputMode="decimal"
            required
            defaultValue={inicial("precioUsd", producto?.precioUsd.toFixed(2))}
            error={error("precioUsd")}
          />
          <CampoTexto
            id="tamanoMl"
            name="tamanoMl"
            etiqueta="Tamaño (ml)"
            inputMode="numeric"
            required
            defaultValue={inicial("tamanoMl", producto?.tamanoMl, "100")}
            error={error("tamanoMl")}
          />
          <CampoTexto
            id="stock"
            name="stock"
            etiqueta="Stock (unidades)"
            inputMode="numeric"
            required
            defaultValue={inicial("stock", producto?.stock, "0")}
            error={error("stock")}
          />
        </div>
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend>Clasificación</legend>
        <div className={styles.columnas3}>
          <Campo id="categoriaId" etiqueta="Categoría" error={error("categoriaId")}>
            {(describedBy) => (
              <select
                id="categoriaId"
                name="categoriaId"
                className={styles.control}
                defaultValue={inicial("categoriaId", producto?.categoriaId)}
                aria-invalid={error("categoriaId") ? true : undefined}
                aria-describedby={describedBy}
              >
                <option value="">Elige…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo id="familia" etiqueta="Familia olfativa" error={error("familia")}>
            {(describedBy) => (
              <select
                id="familia"
                name="familia"
                className={styles.control}
                defaultValue={inicial("familia", producto?.familia)}
                aria-invalid={error("familia") ? true : undefined}
                aria-describedby={describedBy}
              >
                <option value="">Elige…</option>
                {FAMILIAS.map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo id="estado" etiqueta="Estado" error={error("estado")}>
            {(describedBy) => (
              <select
                id="estado"
                name="estado"
                className={styles.control}
                defaultValue={inicial("estado", producto?.estado, "activo")}
                aria-invalid={error("estado") ? true : undefined}
                aria-describedby={describedBy}
              >
                {ESTADOS.map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        </div>
        <div className={styles.casillas}>
          <label className={styles.casilla}>
            <input type="checkbox" name="destacado" defaultChecked={marcado("destacado")} />
            Destacado en portada
          </label>
          <label className={styles.casilla}>
            <input type="checkbox" name="novedad" defaultChecked={marcado("novedad")} />
            Marcar como novedad
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend>Notas olfativas</legend>
        <p className={styles.ayuda}>Separa las notas con comas. Al menos una nota en total.</p>
        <CampoTexto
          id="notasSalida"
          name="notasSalida"
          etiqueta="Notas de salida"
          defaultValue={inicial("notasSalida", producto?.notasSalida.join(", "))}
          error={error("notasSalida")}
        />
        <CampoTexto
          id="notasCorazon"
          name="notasCorazon"
          etiqueta="Notas de corazón"
          defaultValue={inicial("notasCorazon", producto?.notasCorazon.join(", "))}
        />
        <CampoTexto
          id="notasFondo"
          name="notasFondo"
          etiqueta="Notas de fondo"
          defaultValue={inicial("notasFondo", producto?.notasFondo.join(", "))}
        />
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend>Foto</legend>
        <div className={styles.foto}>
          <div className={styles.vistaPrevia} aria-hidden="true">
            {vistaPrevia || imagenActual ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), next/image no aplica
              <img src={vistaPrevia ?? imagenActual ?? ""} alt="" />
            ) : (
              <span>Sin foto</span>
            )}
          </div>
          <div className={styles.fotoCampos}>
            <Campo
              id="imagen"
              etiqueta={imagenActual ? "Reemplazar foto" : "Subir foto"}
              ayuda="JPG, PNG o WebP de hasta 4 MB. Recomendado: cuadrada, 1200 × 1200 px."
              error={error("imagen")}
            >
              {(describedBy) => (
                <input
                  id="imagen"
                  name="imagen"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.archivo}
                  aria-invalid={error("imagen") ? true : undefined}
                  aria-describedby={describedBy}
                  onChange={(e) => {
                    const archivo = e.target.files?.[0];
                    setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
                  }}
                />
              )}
            </Campo>
            <CampoTexto
              id="imagenAlt"
              name="imagenAlt"
              etiqueta="Descripción de la foto (texto alternativo)"
              ayuda="Lo leen los lectores de pantalla. Ej.: «Frasco de 100 ml sobre fondo arena»."
              defaultValue={inicial("imagenAlt", producto?.imagenAlt)}
              error={error("imagenAlt")}
            />
            {imagenActual ? (
              <label className={styles.casilla}>
                <input type="checkbox" name="quitarImagen" />
                Quitar la foto actual (la tienda mostrará el marcador)
              </label>
            ) : null}
          </div>
        </div>
      </fieldset>

      <div className={styles.pie}>
        <BotonGuardar editando={editando} pending={guardando} />
        <Boton href="/dashboard/productos" variante="terciario">
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
