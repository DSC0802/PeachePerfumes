import { unlink } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

/**
 * Teardown global de Playwright:
 * - borra los usuarios que crean los E2E de identidad (`emailAleatorio()` en
 *   tests/identidad.spec.ts); sus sesiones caen por ON DELETE CASCADE;
 * - borra los productos que crea tests/dashboard.spec.ts (slug `e2e-…`) y sus
 *   fotos en el almacén local (F3-C).
 *
 * Los patrones son estrictos (formato exacto) para no tocar nunca datos reales.
 * Sin DATABASE_URL o con la BD caída solo avisa: la limpieza no debe hacer
 * fallar una ejecución de tests que ya terminó.
 *
 * Nombre `.ts` sin `.spec`/`.test`: no lo recoge ni Playwright ni Vitest.
 */
const PATRON_EMAIL_E2E = String.raw`^e2e-[0-9]+-[a-z0-9]+@ejemplo\.cu$`;
const PATRON_SLUG_E2E = String.raw`^e2e-perfume-[a-z0-9]+$`;
const PATRON_IMAGEN = /^\/imagenes\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/;

export default async function limpiezaGlobal(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[limpieza E2E] Sin DATABASE_URL: no se borran datos de prueba.");
    return;
  }

  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 3000 });
  try {
    // F3-D: los pedidos de los usuarios de prueba devuelven su stock reservado y
    // se borran antes (pedidos → usuarios es ON DELETE RESTRICT).
    const deUsuariosE2E = "SELECT id FROM usuarios WHERE rol = 'cliente' AND email ~ $1";
    await pool.query(
      `UPDATE productos p SET stock = p.stock + l.cantidad
         FROM pedido_lineas l JOIN pedidos o ON o.id = l.pedido_id
        WHERE l.producto_id = p.id AND o.estado <> 'cancelado' AND o.usuario_id IN (${deUsuariosE2E})`,
      [PATRON_EMAIL_E2E],
    );
    const pedidos = await pool.query(`DELETE FROM pedidos WHERE usuario_id IN (${deUsuariosE2E})`, [
      PATRON_EMAIL_E2E,
    ]);
    console.log(`[limpieza E2E] Pedidos de prueba borrados: ${pedidos.rowCount ?? 0}`);

    const usuarios = await pool.query(
      "DELETE FROM usuarios WHERE rol = 'cliente' AND email ~ $1",
      [PATRON_EMAIL_E2E],
    );
    console.log(`[limpieza E2E] Usuarios de prueba borrados: ${usuarios.rowCount ?? 0}`);

    const productos = await pool.query<{ imagen_src: string }>(
      "DELETE FROM productos WHERE slug ~ $1 RETURNING imagen_src",
      [PATRON_SLUG_E2E],
    );
    const directorio = path.resolve(process.env.DIR_IMAGENES ?? path.join("almacen", "imagenes"));
    for (const { imagen_src } of productos.rows) {
      const archivo = PATRON_IMAGEN.exec(imagen_src)?.[1];
      if (archivo) await unlink(path.join(directorio, archivo)).catch(() => {});
    }
    console.log(`[limpieza E2E] Productos de prueba borrados: ${productos.rowCount ?? 0}`);

    // F3-C2: la tasa que fija tests/dashboard.spec.ts (valor reservado 987.65).
    const tasas = await pool.query("DELETE FROM tasas_cambio WHERE cup_por_usd = 987.65");
    console.log(`[limpieza E2E] Tasas de prueba borradas: ${tasas.rowCount ?? 0}`);

    // F3-D: el número de WhatsApp reservado que pone el E2E si no había ninguno.
    await pool.query("DELETE FROM ajustes WHERE clave = 'whatsapp_tienda' AND valor = '5300000000'");
  } catch (error) {
    console.warn(`[limpieza E2E] No se pudo limpiar: ${(error as Error).message}`);
  } finally {
    await pool.end();
  }
}
