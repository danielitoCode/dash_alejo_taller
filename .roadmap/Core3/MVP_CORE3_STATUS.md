# MVP Core 3 — Estado vivo (dash)

**Última actualización:** 2026-08-27  
**Rama:** `Core3`  
**Core 3 cerrado:** **NO**

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema / tipos supplier | **Hecho** |
| B1 Proveedores UI + selector en factura | **Hecho + smoke UI OK** |
| B2 Historial compras (listado → detalle) | **Hecho + smoke UI OK** |
| B3 Anulación/corrección | pendiente (opcional 1er release) |
| B4 Permisos consola + smoke E2E datos | parcial (UI smoke OK; falta consola Appwrite) |
| B5 Espejo AT | pendiente |
| B6 Merge master | no |

### Smoke verificado 2026-08-27 (dash)

| Flujo | Resultado |
|-------|-----------|
| Subvista **Proveedores** en nav | OK |
| Crear proveedor desde **factura de entrada** (`+ Nuevo proveedor…`) | OK |
| Subvista **Compras**: listado de entradas | OK |
| Click en fila → **detalle** de la compra | OK |

### B1 entregables

- Case uses: list / create / update supplier (sin delete)
- Pantalla **Proveedores** (`suppliers`, owner/admin)
- Modal factura: existente | sin proveedor | nuevo al vuelo

### B2 entregables

- Listado + detalle + movements por `entry_id`
- Ruta **Compras** (`purchases`)
- Filtros fecha / proveedor / usuario / texto

Ver checklist unificado.
