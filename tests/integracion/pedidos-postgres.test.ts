import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cambiarEstadoPedido,
  crearPedido,
  ErrorPedido,
  obtenerPedidoAdmin,
  obtenerPedidoDeUsuario,
} from "@/lib/pedidos/repositorio";

/**
 * Integración F3-D contra PostgreSQL real.
 * - Usuarios de prueba propios (test-integracion-…@ejemplo.cu), borrados al final
 *   junto con sus pedidos (cascada a líneas, historial y notificaciones).
 * - Se pide 1 unidad de un producto de la semilla con stock ≥ 5 (el último por
 *   slug: la suite de moneda toca el primero en paralelo); el stock se
 *   restaura al terminar. Sigue disponible todo el tiempo, así que la suite
 *   espejo que corre en paralelo no cambia.
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
    await sondeo.query("SELECT 1 FROM pedidos LIMIT 1");
    disponible = true;
  } catch (error) {
    process.stderr.write(`\n⚠ Suite pedidos Postgres OMITIDA — ${(error as Error).message}\n`);
  } finally {
    await sondeo.end();
  }
} else {
  process.stderr.write("\n⚠ Suite pedidos Postgres OMITIDA — falta DATABASE_URL en .env.local\n");
}

const marca = Date.now().toString(36);
let pool: Pool;
let cliente = "";
let otro = "";
let adminId = "";
let producto = { slug: "", precio: 0, stockInicial: 0 };

const stockActual = async () =>
  (await pool.query<{ stock: number }>("SELECT stock FROM productos WHERE slug = $1", [producto.slug])).rows[0].stock;

beforeAll(async () => {
  if (!disponible) return;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const crear = async (sufijo: string) =>
    (
      await pool.query<{ id: string }>(
        "INSERT INTO usuarios (email, password_hash, rol) VALUES ($1, 'x', 'cliente') RETURNING id",
        [`test-integracion-${marca}-${sufijo}@ejemplo.cu`],
      )
    ).rows[0].id;
  cliente = await crear("a");
  otro = await crear("b");
  adminId = (await pool.query<{ id: string }>("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1")).rows[0].id;
  const { rows } = await pool.query<{ slug: string; precio_usd: string; stock: number }>(
    "SELECT slug, precio_usd, stock FROM productos WHERE NOT oculto AND estado = 'activo' AND stock >= 5 ORDER BY slug DESC LIMIT 1",
  );
  producto = { slug: rows[0].slug, precio: Number(rows[0].precio_usd), stockInicial: rows[0].stock };
});

afterAll(async () => {
  if (!disponible) return;
  await pool.query("DELETE FROM pedidos WHERE usuario_id = ANY($1::uuid[])", [[cliente, otro]]);
  await pool.query("DELETE FROM usuarios WHERE id = ANY($1::uuid[])", [[cliente, otro]]);
  await pool.query("UPDATE productos SET stock = $2 WHERE slug = $1", [producto.slug, producto.stockInicial]);
  await pool.end();
});

describe.skipIf(!disponible)("pedidos (PostgreSQL)", () => {
  it("crea el pedido, reserva stock y es idempotente con la misma clave", async () => {
    const clave = randomUUID();
    const lineas = [{ slug: producto.slug, cantidad: 1, precioVisto: producto.precio }];
    const primero = await crearPedido({ usuarioId: cliente, lineas, clave });
    expect(primero.nuevo).toBe(true);
    expect(await stockActual()).toBe(producto.stockInicial - 1);

    const repetido = await crearPedido({ usuarioId: cliente, lineas, clave });
    expect(repetido).toEqual({ numero: primero.numero, nuevo: false });
    expect(await stockActual()).toBe(producto.stockInicial - 1);

    const pedido = await obtenerPedidoDeUsuario(primero.numero, cliente);
    expect(pedido?.estado).toBe("pendiente");
    expect(pedido?.totalUsd).toBe(producto.precio);
    expect(pedido?.lineas).toHaveLength(1);
    expect(pedido?.historial.map((h) => h.estado)).toEqual(["pendiente"]);

    const { rows } = await pool.query("SELECT 1 FROM notificaciones n JOIN pedidos p ON p.id = n.pedido_id WHERE p.numero = $1", [
      primero.numero,
    ]);
    expect(rows).toHaveLength(1);
  });

  it("un cliente no ve pedidos ajenos", async () => {
    const { numero } = await crearPedido({
      usuarioId: cliente,
      lineas: [{ slug: producto.slug, cantidad: 1, precioVisto: producto.precio }],
      clave: randomUUID(),
    });
    expect(await obtenerPedidoDeUsuario(numero, otro)).toBeNull();
    expect(await obtenerPedidoAdmin(numero)).not.toBeNull();
  });

  it("sin stock suficiente o con precio desactualizado no crea nada", async () => {
    const antes = await stockActual();
    // Stock bajo temporal: pedir 3 con 2 disponibles.
    await pool.query("UPDATE productos SET stock = 2 WHERE slug = $1", [producto.slug]);
    try {
      await expect(
        crearPedido({
          usuarioId: otro,
          lineas: [{ slug: producto.slug, cantidad: 3, precioVisto: producto.precio }],
          clave: randomUUID(),
        }),
      ).rejects.toMatchObject({ codigo: "cambios" });
      expect(await stockActual()).toBe(2);
    } finally {
      await pool.query("UPDATE productos SET stock = $2 WHERE slug = $1", [producto.slug, antes]);
    }
    await expect(
      crearPedido({
        usuarioId: otro,
        lineas: [{ slug: producto.slug, cantidad: 1, precioVisto: producto.precio + 1 }],
        clave: randomUUID(),
      }),
    ).rejects.toBeInstanceOf(ErrorPedido);
    expect(await stockActual()).toBe(antes);
    const { rows } = await pool.query("SELECT 1 FROM pedidos WHERE usuario_id = $1", [otro]);
    expect(rows).toHaveLength(0);
  });

  it("cancelar devuelve el stock; transiciones inválidas se rechazan", async () => {
    const { numero } = await crearPedido({
      usuarioId: otro,
      lineas: [{ slug: producto.slug, cantidad: 1, precioVisto: producto.precio }],
      clave: randomUUID(),
    });
    const conReserva = await stockActual();
    await cambiarEstadoPedido(numero, "en_preparacion", adminId);
    await expect(cambiarEstadoPedido(numero, "confirmado", adminId)).rejects.toMatchObject({
      codigo: "transicion_invalida",
    });
    await cambiarEstadoPedido(numero, "cancelado", adminId);
    expect(await stockActual()).toBe(conReserva + 1);
    const pedido = await obtenerPedidoAdmin(numero);
    expect(pedido?.historial.map((h) => h.estado)).toEqual(["pendiente", "en_preparacion", "cancelado"]);
    await expect(cambiarEstadoPedido(numero, "confirmado", adminId)).rejects.toBeInstanceOf(ErrorPedido);
  });

  it("saltar de pendiente a entregado deja una sola entrada y conserva la venta", async () => {
    const { numero } = await crearPedido({
      usuarioId: otro,
      lineas: [{ slug: producto.slug, cantidad: 1, precioVisto: producto.precio }],
      clave: randomUUID(),
    });
    const conReserva = await stockActual();
    await cambiarEstadoPedido(numero, "entregado", adminId);
    expect(await stockActual()).toBe(conReserva);
    const pedido = await obtenerPedidoAdmin(numero);
    expect(pedido?.estado).toBe("entregado");
    expect(pedido?.historial.map((h) => h.estado)).toEqual(["pendiente", "entregado"]);
    await expect(cambiarEstadoPedido(numero, "cancelado", adminId)).rejects.toMatchObject({
      codigo: "transicion_invalida",
    });
  });

  it("no permite más de 3 pedidos pendientes por cliente", async () => {
    // El cliente ya tiene 2 pendientes de los tests anteriores.
    await crearPedido({
      usuarioId: cliente,
      lineas: [{ slug: producto.slug, cantidad: 1, precioVisto: producto.precio }],
      clave: randomUUID(),
    });
    await expect(
      crearPedido({
        usuarioId: cliente,
        lineas: [{ slug: producto.slug, cantidad: 1, precioVisto: producto.precio }],
        clave: randomUUID(),
      }),
    ).rejects.toMatchObject({ codigo: "limite_pendientes" });
  });
});
