# Peache Perfumes — Instrucciones del proyecto

## Contexto
Tienda de perfumes "Peache Perfumes". Proyecto iniciado el 24/10/2026 en `C:\Users\sueir\Dev\PeachePerfumes`.
Decisiones comerciales definidas por el usuario; no re-litigarlas ni preguntar de nuevo.

## Restricciones de seguridad (obligatorias)
- NO modificar la configuración global de OpenCode (`~/.config/opencode/`): agents, plugins, skills, service.json.
- NO copiar configuraciones de otros proyectos.
- NO instalar dependencias sin aprobación explícita del usuario.
- NO hacer cambios destructivos (borrar, sobrescribir trabajo existente, git reset/force) sin confirmación.
- NO tocar archivos ajenos al workspace.
- Ejecutar comandos de riesgo solo tras pedir permiso.

## Preferencias de trabajo
- El usuario trabaja en español; responder en español.
- Idioma de la interfaz: a confirmar en el diseño (probablemente español).
- Antes de construir, cargar las skills aplicables: `brainstorming`, `designing-frontend-interfaces`, `designing-user-experience`, `applying-themes`, `building-accessible-interfaces`.
- Para tareas paralelas e independientes: skill `dispatching-parallel-agents`.
- Antes de declarar completado un trabajo: skill `verifying-before-completion` (evidencia antes que afirmaciones).

## Stack técnico

- **Frontend:** Next.js 16 (App Router, Server Components) + React 19 + TypeScript.
- **Datos:** PostgreSQL 18 (instalado el 27/10/2026 en T1) + Drizzle ORM. Esquema/migraciones en `db/`, semilla `npm run db:seed`. Fuente conmutable `FUENTE_CATALOGO=demo|postgres` (defecto `demo`) — spec `docs/specs/2026-10-27-f3a-postgres-drizzle-design.md`.
- **Tests:** Vitest (unit + espejo de BD) y Playwright + axe-core (E2E/accesibilidad): 5 suites.
- **Moneda base:** USD (decisión D5); conversión a CUP → F3-C.

## Estructura del proyecto
```
/ (raíz del workspace)
├── AGENTS.md          # este archivo
└── ...                # código generado en fases posteriores
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
