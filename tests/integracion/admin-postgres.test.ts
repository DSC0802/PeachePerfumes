import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import {
  actualizarProducto,
  cambiarEstado,
  crearProducto,
  establecerOculto,
  listarCategoriasAdmin,
  listarClientes,
  listarProductosAdmin,
  obtenerProductoAdmin,
  slugEnUso,
} from "@/lib/admin/repositorio-admin";
import type { EntradaProducto } from "@/lib/admin/tipos";

/**
 * Integración del repositorio admin (F3-C) contra PostgreSQL real.
 * - El producto de prueba se crea OCULTO y nunca se hace visible: la suite
 *   espejo del catálogo corre en paralelo y cuenta los productos visibles.
 * - Slug `test-integracion-…`; se borra en afterAll.
 * - Omisión visible por stderr si no hay BD (mismo criterio que la espejo).
 */

try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
    process.stderr.write(`\n⚠ .env.local ilegible: ${(error as Error).message}\n`);
  }
}

let disponible = false;
if (process.env.DATABASE_URL) {
  const sondeo = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
  try {
    await sondeo.query("SELECT 1");
    disponible = true;
  } catch (error) {
    process.stderr.write(`\n⚠ Suite admin Postgres OMITIDA — la BD no responde: ${(error as Error).message}\n`);
  } finally {
    await sondeo.end();
  }
} else {
  process.stderr.write("\n⚠ Suite admin Postgres OMITIDA — falta DATABASE_URL en .env.local\n");
}

const SLUG = `test-integracion-${Date.now().toString(36)}`;

afterAll(async () => {
  if (!disponible) return;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("DELETE FROM productos WHERE slug LIKE 'test-integracion-%'");
  await pool.end();
});

describe.skipIf(!disponible)("repositorio admin (PostgreSQL)", () => {
  it("crea oculto → edita → cambia estado, sin aparecer nunca en la tienda", async () => {
    const [categoria] = await listarCategoriasAdmin();
    const entrada: EntradaProducto = {
      slug: SLUG,
      marca: "Test",
      nombre: "Perfume de integración",
      tamanoMl: 30,
      precioUsd: 19.99,
      descripcion: "Creado por la suite de integración.",
      notasSalida: ["lima"],
      notasCorazon: [],
      notasFondo: ["almizcle"],
      imagenAlt: "",
      categoriaId: categoria.id,
      familia: "citrico",
      destacado: false,
      novedad: true,
      estado: "activo",
      stock: 7,
    };

    const creado = await crearProducto(entrada, "", { oculto: true });
    expect(creado.oculto).toBe(true);
    expect(creado.tamano).toBe("30 ml");
    expect(creado.precioUsd).toBe(19.99);
    expect(await slugEnUso(SLUG)).toBe(true);
    expect(await slugEnUso(SLUG, creado.id)).toBe(false);

    const visibles = await listarProductosAdmin({ q: SLUG });
    expect(visibles).toHaveLength(0);
    const conOcultos = await listarProductosAdmin({ q: SLUG, incluirOcultos: true });
    expect(conOcultos.map((p) => p.id)).toEqual([creado.id]);

    const editado = await actualizarProducto(creado.id, { ...entrada, precioUsd: 25, stock: 0 });
    expect(editado?.precioUsd).toBe(25);
    expect(editado?.stock).toBe(0);
    expect(editado?.oculto).toBe(true);
    expect(editado!.actualizadoEn.getTime()).toBeGreaterThan(creado.actualizadoEn.getTime() - 1);

    const agotado = await cambiarEstado(creado.id, "agotado");
    expect(agotado?.estado).toBe("agotado");
    expect(await listarProductosAdmin({ q: SLUG, estado: "agotado", incluirOcultos: true })).toHaveLength(1);
    expect(await listarProductosAdmin({ q: SLUG, estado: "activo", incluirOcultos: true })).toHaveLength(0);

    const sigueOculto = await establecerOculto(creado.id, true);
    expect(sigueOculto?.oculto).toBe(true);

    const leido = await obtenerProductoAdmin(creado.id);
    expect(leido?.slug).toBe(SLUG);
  });

  it("el stock no puede ser negativo (CHECK en la BD)", async () => {
    const [p] = await listarProductosAdmin({ q: SLUG, incluirOcultos: true });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await expect(pool.query("UPDATE productos SET stock = -1 WHERE id = $1", [p.id])).rejects.toThrow(
      /productos_stock_no_negativo/,
    );
    await pool.end();
  });

  it("obtenerProductoAdmin devuelve null con ids no válidos", async () => {
    expect(await obtenerProductoAdmin("no-es-un-uuid")).toBeNull();
    expect(await obtenerProductoAdmin("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("listarClientes nunca expone el hash de la contraseña", async () => {
    const cuentas = await listarClientes();
    expect(cuentas.length).toBeGreaterThan(0);
    for (const c of cuentas) {
      expect(Object.keys(c).sort()).toEqual(["creadoEn", "email", "id", "nombre", "rol", "telefono"]);
    }
  });

  it("la búsqueda escapa comodines de LIKE", async () => {
    expect(await listarProductosAdmin({ q: "%", incluirOcultos: true })).toHaveLength(0);
  });
});
