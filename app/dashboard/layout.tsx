import type { ReactNode } from "react";
import AppLayoutDashboard from "@/components/layout/AppLayoutDashboard";
import { MonedaProveedor } from "@/components/moneda/MonedaContexto";
import { requerirAdmin } from "@/lib/auth/acceso";
import { contarNoLeidas, contarPedidos } from "@/lib/pedidos/repositorio";

/**
 * Layout de /dashboard: defensa en profundidad tras el proxy (spec F3-B §6)
 * y shell del panel (F3-C). Si la sesión caducó, `requerirAdmin()` redirige a /login.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const admin = await requerirAdmin();
  const [pedidos, notificaciones] = await Promise.all([
    contarPedidos("pendiente").catch(() => 0),
    contarNoLeidas(),
  ]);
  return (
    <AppLayoutDashboard cuenta={{ nombre: admin.nombre, email: admin.email }} contadores={{ pedidos, notificaciones }}>
      {/* El panel trabaja siempre en USD, la moneda base de los datos (spec F3-C2 §3). */}
      <MonedaProveedor monedaInicial="USD" tasa={null}>
        {children}
      </MonedaProveedor>
    </AppLayoutDashboard>
  );
}
