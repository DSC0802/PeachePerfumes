import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cambiarEstadoPedido, crearPedido } from "@/lib/pedidos/repositorio";
import { claveDia, rangoConsulta, ventasDelPeriodo } from "@/lib/reportes/agregados";
import { recuentoPorEstado, ventasEntregadas } from "@/lib/reportes/ventas";

/**
 * Integración F3-E contra PostgreSQL real: una venta es un pedido entregado y
 * cuenta en su fecha de entrega. Usuario y pedidos propios (borrados al final);
 * producto de la semilla distinto de los que usan las otras suites (2.º por
 * slug descendente), con su stock restaurado.
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
    await sondeo.query("SELECT 1 FROM pedido_historial LIMIT 1");
    disponible = true;
  } catch (error) {
    process.stderr.write(`\n⚠ Suite ventas Postgres OMITIDA — ${(error as Error).message}\n`);
  } finally {
    await sondeo.end();
  }
} else {
  process.stderr.write("\n⚠ Suite ventas Postgres OMITIDA — falta DATABASE_URL en .env.local\n");
}

let pool: Pool;
let cliente = "";
let adminId = "";
let producto = { slug: "", precio: 0, stockInicial: 0 };

beforeAll(async () => {
  if (!disponible) return;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  cliente = (
    await pool.query<{ id: string }>(
      "INSERT INTO usuarios (email, password_hash, rol) VALUES ($1, 'x', 'cliente') RETURNING id",
      [`test-integracion-ventas-${Date.now().toString(36)}@ejemplo.cu`],
    )
  ).rows[0].id;
  adminId = (await pool.query<{ id: string }>("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1")).rows[0].id;
  const { rows } = await pool.query<{ slug: string; precio_usd: string; stock: number }>(
    "SELECT slug, precio_usd, stock FROM productos WHERE NOT oculto AND estado = 'activo' AND stock >= 5 ORDER BY slug DESC OFFSET 1 LIMIT 1",
  );
  producto = { slug: rows[0].slug, precio: Number(rows[0].precio_usd), stockInicial: rows[0].stock };
});

afterAll(async () => {
  if (!disponible) return;
  await pool.query("DELETE FROM pedidos WHERE usuario_id = $1", [cliente]);
  await pool.query("DELETE FROM usuarios WHERE id = $1", [cliente]);
  await pool.query("UPDATE productos SET stock = $2 WHERE slug = $1", [producto.slug, producto.stockInicial]);
  await pool.end();
});

const pedir = (cantidad = 1) =>
  crearPedido({
    usuarioId: cliente,
    lineas: [{ slug: producto.slug, cantidad, precioVisto: producto.precio }],
    clave: randomUUID(),
  });

describe.skipIf(!disponible)("ventas (PostgreSQL)", () => {
  it("entregado cuenta como venta en su fecha de entrega; en curso y cancelado no", async () => {
    const hoy = claveDia(new Date());
    const periodo = { clave: "personalizado" as const, desde: hoy, hasta: hoy };
    const antes = await recuentoPorEstado(rangoConsulta(periodo));

    const entregado = await pedir(2);
    for (const estado of ["confirmado", "en_preparacion", "en_camino", "entregado"] as const) {
      await cambiarEstadoPedido(entregado.numero, estado, adminId);
    }
    const enCurso = await pedir(1);
    const cancelado = await pedir(1);
    await cambiarEstadoPedido(cancelado.numero, "cancelado", adminId);

    const { ventas, lineas } = await ventasEntregadas(rangoConsulta(periodo));
    const deHoy = ventasDelPeriodo(ventas, periodo);
    const venta = deHoy.find((v) => v.numero === entregado.numero);
    expect(venta).toMatchObject({ totalUsd: producto.precio * 2, unidades: 2 });
    expect(deHoy.some((v) => v.numero === enCurso.numero || v.numero === cancelado.numero)).toBe(false);
    expect(lineas.filter((l) => l.numero === entregado.numero)).toEqual([
      expect.objectContaining({ slug: producto.slug, cantidad: 2 }),
    ]);

    // Recuentos globales: la suite de pedidos crea y cancela pedidos en paralelo,
    // así que aquí se exige «al menos» lo nuestro; el pedido concreto ya se
    // comprobó arriba de forma exacta.
    const despues = await recuentoPorEstado(rangoConsulta(periodo));
    expect(despues.cobrado.pedidos - antes.cobrado.pedidos).toBeGreaterThanOrEqual(1);
    expect(despues.cobrado.totalUsd - antes.cobrado.totalUsd).toBeGreaterThanOrEqual(producto.precio * 2 - 0.001);
    expect(despues.porCobrar.pedidos - antes.porCobrar.pedidos).toBeGreaterThanOrEqual(1);
    expect(despues.cancelado.pedidos - antes.cancelado.pedidos).toBeGreaterThanOrEqual(1);
    expect(despues.sinConfirmar - antes.sinConfirmar).toBeGreaterThanOrEqual(1);
  });
});
