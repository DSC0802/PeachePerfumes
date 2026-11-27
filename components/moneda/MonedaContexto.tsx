"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  NOMBRE_COOKIE_MONEDA,
  SEGUNDOS_COOKIE_MONEDA,
  valorCookie,
  type MonedaVisible,
} from "@/lib/moneda/conversion";

/**
 * Preferencia de moneda de la tienda (F3-C2, HU-51). El layout raíz la
 * inicializa con la cookie y la tasa vigente de la BD, así la página llega
 * del servidor ya en la moneda correcta (sin parpadeo).
 */
interface MonedaContextoValor {
  moneda: MonedaVisible;
  /** CUP por 1 USD; null = no hay tasa y la tienda sólo muestra USD. */
  tasa: number | null;
  cambiarMoneda: (moneda: MonedaVisible) => void;
}

const MonedaContexto = createContext<MonedaContextoValor | null>(null);

export function MonedaProveedor({
  monedaInicial,
  tasa,
  children,
}: {
  monedaInicial: MonedaVisible;
  tasa: number | null;
  children: ReactNode;
}) {
  const [moneda, setMoneda] = useState<MonedaVisible>(tasa === null ? "USD" : monedaInicial);

  const cambiarMoneda = useCallback((siguiente: MonedaVisible) => {
    setMoneda(siguiente);
    document.cookie = `${NOMBRE_COOKIE_MONEDA}=${valorCookie(siguiente)}; Path=/; Max-Age=${SEGUNDOS_COOKIE_MONEDA}; SameSite=Lax`;
  }, []);

  const valor = useMemo(() => ({ moneda, tasa, cambiarMoneda }), [moneda, tasa, cambiarMoneda]);
  return <MonedaContexto.Provider value={valor}>{children}</MonedaContexto.Provider>;
}

/** Sin proveedor (tests aislados, panel) se comporta como «sólo USD». */
export function useMoneda(): MonedaContextoValor {
  return (
    useContext(MonedaContexto) ?? {
      moneda: "USD",
      tasa: null,
      cambiarMoneda: () => {},
    }
  );
}
