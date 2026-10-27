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
- Por definir con el usuario en el siguiente paso (landing, catálogo, carrito, checkout).
- Al elegir stack, documentarlo aquí.

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
