# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto:** **3.1 y 3.2** hechos.

## Fase 3 — Auth staff

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **3.1** Rutas vs ROLE_ROUTE_ACCESS | **Hecho** | NestedNav + tests |
| **3.2** UserManagement + canManageRole | **Hecho** | store assert + UI filtrada + tests |
| **3.3** Labels Appwrite | Parcial | `getRoleLabels` en create/setRole |
| **3.4** Sin visitante tienda | Base login staff |

## 3.2 comportamiento

- Alta / cambio de rol: `assertCanAssignRole(manager, newRole, currentTarget?)`
- UI: select de roles solo con `assignableRoles(manager)`
- Bloqueo y reset password: no toca usuarios de mayor jerarquía
- Labels vía `getRoleLabels` (no matriz inline)

```bash
npm run test:unit
```

## Siguiente

**3.3** formalizar labels en toda la cadena / **Fase 4** currency en ventas.
