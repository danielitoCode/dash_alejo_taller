# MVP Core 3 — Estado vivo (dash)

**Última actualización:** 2026-08-28  
**Rama:** `Core3`  
**Core 3 cerrado:** **NO**

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema / tipado supplier | **Confirmado casi cerrado** (política, audit schema, tipado `contact` hechos). Restan: verificación manual consola (índices `purchase_entry` + `stock_movements.entry_id` + permisos cliente) y espejo AT |
| B1 Proveedores UI + selector en factura | **Hecho + smoke UI OK** |
| B2 Historial compras (listado → detalle) | **Hecho + smoke UI OK** |
| B3 Anulación/corrección | pendiente (opcional 1er release) |
| B4 Permisos + smoke E2E | **En curso** — iniciar ahora (ver `SMOKE_B4.md`) |
| B5 Espejo AT | pendiente |
| B6 Merge master | no |

### Smoke UI ya verificado (2026-08-27)

| Flujo | Resultado |
|-------|-----------|
| Subvista **Proveedores** | OK |
| Alta proveedor desde **factura de entrada** | OK |
| Subvista **Compras** listado → detalle | OK |

### B4 — qué falta comprobar

Ver checklist ejecutable en [`SMOKE_B4.md`](./SMOKE_B4.md):

1. Consola Appwrite (permisos cliente sin write + `entry_id`)
2. E2E datos: factura multi-línea → stock → movements en detalle
3. Roles nav (sales/viewer sin Compras/Proveedores)
4. Frontera AT (opcional en paralelo)

Ver checklist unificado.
