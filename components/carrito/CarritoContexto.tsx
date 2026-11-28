"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { Producto } from "@/lib/catalogo/tipos";

/** Una línea del carrito. */
export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface CarritoContextoValor {
  /** Líneas del carrito. */
  items: ItemCarrito[];
  /** Total de unidades (suma de cantidades). */
  totalItems: number;
  /** Importe total del carrito en unidades de moneda. */
  obtenerTotal: () => number;
  /** Añade un producto (o aumenta su cantidad si ya está). */
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  /** Elimina una línea completa por id de producto. */
  removerProducto: (productoId: string) => void;
  /** Cambia la cantidad de una línea (< 1 la elimina). */
  actualizarCantidad: (productoId: string, cantidad: number) => void;
  /** Vacía el carrito. */
  limpiarCarrito: () => void;
}

const CARRITO_STORAGE_KEY = "peache-carrito";

/**
 * Tienda externa mínima: localStorage es la fuente persistente y
 * `useSyncExternalStore` la lee durante el render (sin `useEffect` ni
 * `setState` dentro de efectos). `obtenerSnapshotEnServidor` devuelve `[]`
 * para que la hidratación coincida con el HTML del servidor (carrito vacío);
 * tras la hidratación se lee de localStorage.
 */

let estadoCarrito: ItemCarrito[] = [];
const oyentes = new Set<() => void>();

function leerCarritoGuardado(): ItemCarrito[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = localStorage.getItem(CARRITO_STORAGE_KEY);
    if (!crudo) return [];
    const parsed = JSON.parse(crudo);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entrada: unknown): entrada is ItemCarrito =>
        typeof entrada === "object" &&
        entrada !== null &&
        "producto" in entrada &&
        typeof (entrada as ItemCarrito).cantidad === "number",
    );
  } catch {
    return [];
  }
}

// Solo en cliente se rehidrata la memoria desde localStorage.
if (typeof window !== "undefined") {
  estadoCarrito = leerCarritoGuardado();
}

function obtenerSnapshot(): ItemCarrito[] {
  return estadoCarrito;
}

// Referencia estable: useSyncExternalStore exige que el snapshot del servidor
// no cambie entre llamadas.
const CARRITO_VACIO: ItemCarrito[] = [];

function obtenerSnapshotEnServidor(): ItemCarrito[] {
  return CARRITO_VACIO;
}

function suscribir(onCambio: () => void) {
  if (typeof window === "undefined") return () => {};
  oyentes.add(onCambio);
  const manejarStorage = () => {
    estadoCarrito = leerCarritoGuardado();
    notificar();
  };
  window.addEventListener("storage", manejarStorage);
  return () => {
    oyentes.delete(onCambio);
    window.removeEventListener("storage", manejarStorage);
  };
}

function notificar() {
  oyentes.forEach((cb) => cb());
}

function escribirEstado(siguiente: ItemCarrito[]) {
  estadoCarrito = siguiente;
  try {
    localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(siguiente));
  } catch {
    // Cuota de localStorage excedida o modo privado: seguir funcionando sin persistir.
  }
  notificar();
}

const CarritoContexto = createContext<CarritoContextoValor | undefined>(undefined);

export function CarritoProveedor({
  children,
}: {
  children: ReactNode;
}) {
  const items = useSyncExternalStore(
    suscribir,
    obtenerSnapshot,
    obtenerSnapshotEnServidor,
  );

  const totalItems = items.reduce((suma, linea) => suma + linea.cantidad, 0);

  const obtenerTotal = useCallback((): number => {
    return items.reduce(
      (suma, linea) => suma + linea.producto.precio * linea.cantidad,
      0,
    );
  }, [items]);

  const agregarProducto = useCallback((producto: Producto, cantidad = 1) => {
    const siguiente = Math.max(1, Math.floor(cantidad));
    const indice = items.findIndex((linea) => linea.producto.id === producto.id);
    const siguienteEstado =
      indice >= 0
        ? items.map((linea, i) =>
            i === indice ? { ...linea, cantidad: linea.cantidad + siguiente } : linea,
          )
        : [...items, { producto, cantidad: siguiente }];
    escribirEstado(siguienteEstado);
  }, [items]);

  const removerProducto = useCallback((productoId: string) => {
    escribirEstado(items.filter((linea) => linea.producto.id !== productoId));
  }, [items]);

  const actualizarCantidad = useCallback((productoId: string, cantidad: number) => {
    const siguiente = Math.max(1, Math.floor(cantidad));
    const linea = items.find((l) => l.producto.id === productoId);
    if (!linea) return;
    escribirEstado(
      items.map((l) =>
        l.producto.id === productoId ? { ...l, cantidad: siguiente } : l,
      ),
    );
  }, [items]);

  const limpiarCarrito = useCallback(() => escribirEstado([]), []);

  const valor: CarritoContextoValor = {
    items,
    totalItems,
    obtenerTotal,
    agregarProducto,
    removerProducto,
    actualizarCantidad,
    limpiarCarrito,
  };

  return (
    <CarritoContexto.Provider value={valor}>
      {children}
    </CarritoContexto.Provider>
  );
}

/**
 * Hook de acceso al carrito. Lanza si se usa fuera de <CarritoProveedor>.
 */
export function useCarrito(): CarritoContextoValor {
  const contexto = useContext(CarritoContexto);
  if (contexto === undefined) {
    throw new Error("useCarrito() debe usarse dentro de <CarritoProveedor>.");
  }
  return contexto;
}
