/**
 * SEMILLA de fábrica (HU-61, spec F3-A §4).
 *
 * Idempotente y NO destructiva (F3-C, D-F3C-SEMILLA): upsert de categorías y de
 * los 14 productos demo por `slug`, en una transacción. Nunca borra productos
 * creados o editados desde el panel admin; no duplica nada.
 * Uso: `npm run db:seed` — requiere `.env.local` con DATABASE_URL y la BD creada.
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { categorias } from "../data/categorias";
import { productos } from "../data/productos";
import {
  categorias as tablaCategorias,
  productos as tablaProductos,
  usuarios as tablaUsuarios,
} from "./schema";

/** Stock determinista de fábrica (F3-C): incluye valores ≤5 para «stock bajo». */
const STOCK_FABRICA = [24, 4, 15, 9, 2, 30, 18, 5, 12, 7, 20, 3, 14, 10];

async function sembrar(): Promise<void> {
  // Los `import` de arriba no leen el entorno; `.env.local` se carga aquí,
  // antes de tocar DATABASE_URL (Next.js lo carga solo para la app, no para tsx).
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Sin .env.local: el error claro lo lanza la comprobación de abajo.
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL en .env.local: configura la cadena de conexión de PostgreSQL.",
    );
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const db = drizzle(pool);

    await db.transaction(async (transaccion) => {
      // F3-C (D-F3C-SEMILLA): la semilla ya NO borra nada. El panel admin crea
      // y edita productos en esta misma tabla; un borrado aquí los perdería.
      await transaccion
        .insert(tablaCategorias)
        .values(
          categorias.map((categoria) => ({
            id: categoria.id,
            slug: categoria.slug,
            nombre: categoria.nombre,
            descripcion: categoria.descripcion,
          })),
        )
        .onConflictDoUpdate({
          target: tablaCategorias.id,
          set: {
            slug: sql`excluded.slug`,
            nombre: sql`excluded.nombre`,
            descripcion: sql`excluded.descripcion`,
          },
        });

      // Demo que falta → se inserta. Demo existente → sólo se rellena el stock
      // de fábrica si la fila sigue intacta (nunca editada desde el panel:
      // `actualizado_en = creado_en`) y su stock es 0 (recién migrada a 0002).
      await transaccion
        .insert(tablaProductos)
        .values(
          productos.map((producto, i) => ({
          slug: producto.slug,
          marca: producto.marca,
          nombre: producto.nombre,
          tamano: producto.tamano,
          tamanoMl: producto.tamanoMl,
          // numeric(10,2): el driver espera string.
          precioUsd: String(producto.precio),
          descripcion: producto.descripcion,
          notasSalida: producto.notas.salida,
          notasCorazon: producto.notas.corazon,
          notasFondo: producto.notas.fondo,
          imagenSrc: producto.imagen.src,
          imagenAlt: producto.imagen.alt,
          categoriaId: producto.categoriaId,
          familia: producto.familia,
          destacado: producto.destacado,
          novedad: producto.novedad,
          stock: STOCK_FABRICA[i % STOCK_FABRICA.length],
        })),
        )
        .onConflictDoUpdate({
          target: tablaProductos.slug,
          set: { stock: sql`excluded.stock` },
          setWhere: sql`${tablaProductos.stock} = 0 AND ${tablaProductos.actualizadoEn} = ${tablaProductos.creadoEn}`,
        });
      // estado y oculto toman sus defaults: 'activo' y false (spec §4).

      // ===================== ADMIN (F3-B §8) =====================
      // Upsert idempotente: si el email ya existe, lo promueve a admin
      // con la contraseña vigente.
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminEmail && adminPassword) {
        // Importar inline para evitar carga de lib/auth en tiempo de build
        const { hashContrasena } = await import("../lib/auth/contrasena") as typeof import("../lib/auth/contrasena");
        const passwordHash = await hashContrasena(adminPassword);
        await transaccion
          .insert(tablaUsuarios)
          .values({
            email: adminEmail,
            passwordHash,
            nombre: "Administrador",
            rol: "admin" as import("../lib/auth/tipos").Rol,
          })
          .onConflictDoUpdate({
            target: tablaUsuarios.email,
            set: {
              passwordHash,
              rol: "admin",
              actualizadoEn: new Date(),
            },
          });
      }
    });

    const [totalProductos] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tablaProductos);
    const [totalCategorias] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tablaCategorias);

    console.log(
      `✓ Semilla aplicada: ${totalProductos.n} productos y ${totalCategorias.n} categorías.`,
    );

    // ===================== ADMIN (F3-B §8) =====================
    // Upsert idempotente: si el email ya existe, lo promueve a admin
    // con la contraseña vigente.
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      // Importar inline para evitar carga de lib/auth en tiempo de build
      const { hashContrasena } = await import("../lib/auth/contrasena") as typeof import("../lib/auth/contrasena");
      const passwordHash = await hashContrasena(adminPassword);
      await db
        .insert(tablaUsuarios)
        .values({
          email: adminEmail,
          passwordHash,
          nombre: "Administrador",
          rol: "admin" as import("../lib/auth/tipos").Rol,
        })
        .onConflictDoUpdate({
          target: tablaUsuarios.email,
          set: {
            passwordHash,
            rol: "admin",
            actualizadoEn: new Date(),
          },
        });
      console.log(`✓ Cuenta admin: ${adminEmail}`);
    } else {
      console.warn(
        "⚠ Semilla: faltan ADMIN_EMAIL o ADMIN_PASSWORD en .env.local — no se crea la cuenta admin.",
      );
    }
  } finally {
    await pool.end();
  }
}

sembrar().catch((error: unknown) => {
  console.error("✗ Falló la semilla:", error);
  process.exitCode = 1;
});
