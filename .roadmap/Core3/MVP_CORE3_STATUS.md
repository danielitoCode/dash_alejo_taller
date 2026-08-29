# MVP Core 3 — Estado vivo (dash)

**Última actualización:** 2026-08-29  
**Rama:** `Core3`  
**Core 3 cerrado:** **NO**

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema / consola | **Cerrado** |
| B1 Proveedores UI + selector en factura | **Hecho + smoke UI OK** |
| B2 Historial compras (listado → detalle + filtro producto) | **Hecho + smoke UI OK** |
| B3.1 Anulación completa | **Núcleo + schema `status` OK.** Falta UI anular + smoke operador |
| B3.2 Corrección parcial | pendiente (no bloquea B3.1) |
| B4 Permisos + smoke panel | **Hecho (dash).** AT smoke cruzado: verificar lista en espejo AT |
| B5 Espejo AT | código frontera OK; STATUS AT alineado; smokes AT por confirmar |
| B6 Merge master | no |

### Smoke UI (2026-08-27)

| Flujo | Resultado |
|-------|-----------|
| Subvista **Proveedores** | OK |
| Alta proveedor desde **factura de entrada** | OK |
| Subvista **Compras** listado → detalle | OK |

### B3.1

- `CancelPurchaseEntryCaseUse` + transacciones Appwrite
- Tests unitarios (reserved, idempotencia, movimiento compensatorio)
- Consola: `purchase_entry.status` = `ACTIVE` \| `CANCELLED` (**2026-08-29**)
- Pendiente: botón anular en detalle (owner/admin)

### Siguiente para cerrar Core 3

1. UI anulación en Compras  
2. CI verde  
3. Smokes AT (lista en espejo)  
4. PR `Core3` → `master`  
