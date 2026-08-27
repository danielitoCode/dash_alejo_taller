# MVP Core 3 — Estado vivo (dash)

**Última actualización:** 2026-08-27  
**Rama:** `Core3`  
**Core 3 cerrado:** **NO**

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema / tipos supplier | **Hecho (dash)** |
| B1 Proveedores UI + selector en factura | **Hecho en código** — validar CI + smoke manual |
| B2 Historial compras | **Hecho en código** — listado/detalle/movements; validar CI + smoke |
| B3 Anulación/corrección | pendiente (opcional 1er release) |
| B4 Permisos + smoke | pendiente |
| B5 Espejo AT | pendiente |
| B6 Merge master | no |

### B1 entregables

- Case uses: list / create / update supplier
- `supplier.store` + pantalla **Proveedores** (ruta `suppliers`, owner/admin)
- Modal factura: select proveedor existente | sin proveedor | nuevo por nombre
- Test: mapper supplier

### B2 entregables

- `ListPurchaseEntriesCaseUse` / `GetPurchaseEntryDetailCaseUse`
- `StockMovementRepository.listByEntry`
- UI **Compras** (`purchases`): filtros fecha/proveedor/usuario/texto + detalle líneas + movements
- Tests: `filterPurchaseEntries`, detail assembly, RoleConfig `purchases`

Ver checklist unificado.
