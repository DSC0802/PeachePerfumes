"use client";

import { startTransition, useActionState, useState } from "react";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { guardarTasaAccion, type EstadoFormularioTasa } from "@/lib/moneda/acciones";
import { usdACup, validarTasa } from "@/lib/moneda/conversion";
import auth from "@/components/auth/FormularioAuth.module.css";
import panel from "@/components/dashboard/Panel.module.css";
import styles from "./FormularioTasa.module.css";

interface MuestraPrecio {
  nombre: string;
  precioUsd: number;
}

import { formatearImporte } from "@/lib/moneda/formato";

/**
 * Formulario de la tasa (F3-C2, HU-52) con vista previa en vivo: tres precios
 * reales del catálogo convertidos con lo que se está tecleando.
 */
export default function FormularioTasa({
  tasaActual,
  muestras,
}: {
  tasaActual: number | null;
  muestras: MuestraPrecio[];
}) {
  const [estado, accion, guardando] = useActionState<EstadoFormularioTasa, FormData>(guardarTasaAccion, {});
  const [texto, setTexto] = useState(estado.valor ?? (tasaActual !== null ? String(tasaActual) : ""));
  const previa = validarTasa(texto);

  return (
    <form
      action={accion}
      className={styles.formulario}
      noValidate
      onSubmit={(evento) => {
        // Envío manual: sin el reset automático de React 19 el valor tecleado se conserva.
        evento.preventDefault();
        const datos = new FormData(evento.currentTarget);
        startTransition(() => accion(datos));
      }}
    >
      {estado.error ? (
        <p className={auth.errorFormulario} role="alert">
          {estado.error}
        </p>
      ) : null}
      {estado.ok ? (
        <p className={auth.exito} role="status">
          {estado.ok}
        </p>
      ) : null}

      <div className={styles.fila}>
        <CampoTexto
          id="tasa"
          name="tasa"
          etiqueta="CUP por 1 USD"
          inputMode="decimal"
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          ayuda="Sólo cambia el equivalente en CUP; los precios en USD no se tocan."
          className={styles.campo}
        />
        <Boton type="submit" loading={guardando} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar tasa"}
        </Boton>
      </div>

      {muestras.length > 0 ? (
        <div className={panel.tablaContenedor} tabIndex={0} role="region" aria-label="Vista previa de precios">
          <table className={panel.tabla}>
            <caption className="solo-lectura">Vista previa de precios con la tasa escrita</caption>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col" className={panel.num}>
                  USD
                </th>
                <th scope="col" className={panel.num}>
                  CUP con esta tasa
                </th>
              </tr>
            </thead>
            <tbody>
              {muestras.map((m) => (
                <tr key={m.nombre}>
                  <th scope="row">{m.nombre}</th>
                  <td className={`${panel.num} cifras`}>{formatearImporte(m.precioUsd, "USD")}</td>
                  <td className={`${panel.num} cifras`}>
                    {previa.ok ? formatearImporte(usdACup(m.precioUsd, previa.tasa), "CUP") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </form>
  );
}
