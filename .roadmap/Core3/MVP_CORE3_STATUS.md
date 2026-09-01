# MVP Core 3 — Estado vivo (dash)

**Última actualización:** 2026-09-01  
**Rama:** `Core3`  
**Core 3 (release mínimo):** **SÍ** — listo para PR → `master`  
**B3.2 (corrección parcial):** pendiente post-merge (no bloquea)

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema / consola | **Cerrado** |
| B1 Proveedores UI + selector en factura | **Hecho + smoke UI OK** |
| B2 Historial compras (listado → detalle + filtro producto) | **Hecho + smoke UI OK** |
| B3.1 Anulación completa | **Cerrado** — núcleo + schema `status` + UI + validación reserved + mensajes enriquecidos + UI no optimista |
| B3.2 Corrección parcial | pendiente (no bloquea) |
| B4 Permisos + smoke panel | **Hecho (dash)** |
| B5 Espejo AT | código frontera OK; docs AT alineados |
| B6 Merge master | **en curso** — PR `Core3` → `master` |

### Smoke UI

| Flujo | Resultado |
|-------|-----------|
| Subvista **Proveedores** | OK |
| Alta proveedor desde **factura de entrada** | OK |
| Subvista **Compras** listado → detalle | OK |
| **Anular entrada** (owner/admin) | OK — éxito marca CANCELLED; fallo reserved muestra error y **no** badge Anulada |
| Bloqueo `existence < reserved` | OK — mensaje con producto, existence, reserved y ventas pendientes |

### B3.1 (resumen técnico)

- `CancelPurchaseEntryCaseUse` + `AppwriteTransactionRunner`
- Reversión: `existence -= qty`, movement `ajuste` + `reason=purchase_entry_reversal` + `entry_id`
- **No** modifica `reserved` ni `last_unit_cost`
- Regla: `newExistence >= reserved` o rechazo con mensaje explícito
- UI: solo owner/admin; confirmación; `toastStore.run` (loading sobrevive navegación)
- Store: status `CANCELLED` solo tras execute + loadDetail exitosos

### UX incluido en Core3 (paridad operativa)

- Toast unificado con iconos (success / error / info / warning / loading)
- Loading persistente para anular / registrar factura (stages)
- RealtimeDock flotante eliminado del layout (funciones en panel de navegación)

### Post-merge (no bloquea)

1. B3.2 corrección parcial de líneas  
2. Smoke cruzado AT opcional en dispositivo  
3. Test opcional COGS `last_unit_cost` en AT  
