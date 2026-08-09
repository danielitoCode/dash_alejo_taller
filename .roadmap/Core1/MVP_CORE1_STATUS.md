# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto:** Fase 1–2 catálogo hechas; **3.1 gates de ruta** hechos.

## Fase 3 — Auth staff

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **3.1** Rutas vs `ROLE_ROUTE_ACCESS` | **Hecho** | Shell usa `canAccessRoute` / `getFirstAllowedRoute`; sin matriz duplicada; tests unitarios |
| **3.2** UserManagement + canManageRole | Pendiente |
| **3.3** Labels Appwrite | Pendiente |
| **3.4** Sin sesión visitante tienda | Base (login staff) |

## Tests 3.1

```bash
npm run test:unit
# RoleConfig.routes.unit.test.ts
```

## Fases previas

| Área | Estado |
|------|--------|
| 0.x baseline | Hecho |
| 1–2 stock catálogo + tests | Hecho |

## Siguiente

**3.2** UserManagement respeta `canManageRole` en UI y acciones.
