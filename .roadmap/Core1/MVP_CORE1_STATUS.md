# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto:** Fase 3 hecha; **4.1 listado ventas por estado** hecho.

## Fase 4 — Ventas lectura

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **4.1** Filtros UNVERIFIED / VERIFIED / DELETED | **Hecho** | Tabs + `filterSalesByStatus` + tests; default = pendientes |
| **4.2** Detalle completo | Pendiente |
| **4.3** Currency en UI | Pendiente |
| **4.4** Origen pedido solo lectura | Pendiente |

## 4.1

- Tabs clicables: total / pendientes / confirmadas / rechazadas
- Default: **UNVERIFIED** (cola de supervisión)
- Select de estado sincronizado con el mismo filtro
- Util de dominio testeable: `filterSalesByStatus`, `countSalesByStatus`

```bash
npm run test:unit
```

## Siguiente

**4.2** detalle de venta completo · **4.3** currency del documento Sale.
