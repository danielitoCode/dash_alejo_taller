# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto:** **4.1 y 4.2** hechos.

## Fase 4 — Ventas lectura

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **4.1** Filtros por estado | **Hecho** | Tabs + util + tests |
| **4.2** Detalle completo | **Hecho** | SaleDetail: líneas, qty, amount, currency, userId, fechas, delivery |
| **4.3** Currency en UI listado | Parcial (detalle ya formatea currency del doc) |
| **4.4** Origen solo lectura | Base en detalle |

## 4.2 campos en detalle

- Id venta completo + userId + nombre/email cliente
- Estado legible + código BuyState
- date / $createdAt / $updatedAt
- deliveryType
- Líneas: productId, nombre, qty, unit, total línea
- amount con `currency` del documento (sin forzar USD)

## Siguiente

**4.3** currency también en listado de tarjetas · o **Fase 5** confirm/reject con stock.
