# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto:** **Fase 4 lectura ventas completa (4.1–4.4)**.

## Fase 4 — Ventas lectura

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **4.1** Filtros por estado | **Hecho** | Tabs + util |
| **4.2** Detalle completo | **Hecho** | SaleDetail |
| **4.3** Currency en UI | **Hecho** | formatSaleMoney |
| **4.4** Origen solo lectura / no B2C create | **Hecho** | `BackofficeSalePolicy` + bloqueo `create` net/offline + UI |

## 4.4

- Política: `assertBackofficeCannotCreateB2cSale()` siempre lanza
- `SaleNetRepository.create` / `SaleOfflineFirstRepository.create` no llaman a Appwrite create
- UI: chip “Origen: tienda cliente”; sin botón “Nueva venta”
- Soft-hold solo en clientes AlejoTaller

## Siguiente

**Fase 5** confirm/reject con semántica de stock idéntica al operador.
