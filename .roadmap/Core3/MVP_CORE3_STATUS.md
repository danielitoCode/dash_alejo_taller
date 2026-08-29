# MVP Core 3 — Estado vivo (dash)

**Última actualización:** 2026-08-28  
**Rama:** `Core3`  
**Core 3 cerrado:** **NO**

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema / tipado / consola | **Cerrado (dash)** — resta espejo AT |
| B1 Proveedores UI + selector en factura | **Hecho + smoke UI OK** |
| B2 Historial compras (listado → detalle + filtro producto) | **Hecho + smoke UI OK + código verificado** |
| B3 Anulación/corrección | pendiente (opcional 1er release) |
| B4 Permisos + smoke E2E | **En curso** — permisos consola ya en B0; faltan E2E datos + badges/nav |
| B5 Espejo AT | pendiente |
| B6 Merge master | no |

### Smoke UI ya verificado (2026-08-27)

| Flujo | Resultado |
|-------|-----------|
| Subvista **Proveedores** | OK |
| Alta proveedor desde **factura de entrada** | OK |
| Subvista **Compras** listado → detalle | OK |

### Código B2 verificado (2026-08-28)

- `PurchaseHistory.svelte` — listado, filtros (fecha/proveedor/usuario/texto/moneda/producto), detalle con movements por `entry_id`
- `ListPurchaseEntriesCaseUse` / `GetPurchaseEntryDetailCaseUse`
- `filterPurchaseEntries`
- `StockMovementNetRepository.listByEntry` + `PurchaseEntryNetRepository.listLinesByProduct`

### B4 — qué falta comprobar

Ver checklist ejecutable en [`SMOKE_B4.md`](./SMOKE_B4.md):

1. ~~Consola Appwrite (permisos cliente + `entry_id`)~~ → hecho en B0
2. E2E datos: factura multi-línea → stock → movements en detalle
3. Roles nav (sales/viewer sin Compras/Proveedores)
4. Frontera AT (opcional en paralelo)

Ver checklist unificado.
