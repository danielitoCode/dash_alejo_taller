# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto:** Fase 3 auth staff **3.1–3.3 hechos**.

## Fase 3 — Auth staff

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **3.1** Rutas vs ROLE_ROUTE_ACCESS | **Hecho** | NestedNav + tests |
| **3.2** UserManagement + canManageRole | **Hecho** | store + UI + tests |
| **3.3** Labels Appwrite coherentes | **Hecho** | `resolveBusinessRole` / `getRoleLabels` en admin + account + store |
| **3.4** Sin visitante tienda | Base login staff |

## 3.3 contrato labels

| BusinessRole | Appwrite labels |
|--------------|-----------------|
| owner | `owner`, `admin` |
| admin | `admin` |
| sales | `sales` |
| viewer | `viewer` |

Lectura: labels → rol (prioridad jerárquica). Escritura gestión: siempre `getRoleLabels(role)`.

```bash
npm run test:unit
```

## Siguiente

**3.4** (si hace falta endurecer) o **Fase 4** currency / lectura ventas.
