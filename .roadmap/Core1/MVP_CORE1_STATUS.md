# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto desarrollo:** en alineación — Fase 0 hecha; **Fase 1.1–1.2** en código (`reserved` / `available`).

## Fase 0 — Baseline

| Tarea | Estado |
|-------|--------|
| 0.1 Reglas canónicas | **Hecho** |
| 0.2 Secretos | **Hecho** |
| 0.3 Inventario | **Hecho** |

## Fase 1 — Modelo stock

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **1.1** `reserved` en dominio + factory | **Hecho** | `Product.ts` + `availableStock()` + validaciones |
| **1.2** DTO + mapper | **Hecho** | `ProductDTO`, `productFromDTO` / `productToDTO` / `productToCatalogWriteDTO` |
| **1.3** Dexie schema note | Parcial | `bulkPut` ya persiste campos del DTO; versión explícita v3 opcional |
| **1.4** `available` en UI | **Hecho (listado)** | `ProductManagement` muestra disp. / exist. / res. |
| **1.5** Update no pisa reserved | **Hecho** | offline-first usa `productToCatalogWriteDTO` |

## Siguiente

- Completar **1.3** (Dexie version bump documentado si hace falta)
- **Fase 2** validaciones restantes / form existence ya parcial
- **Fase 3** gates roles
- **Fase 4–5** sale currency + confirm/reject con stock
