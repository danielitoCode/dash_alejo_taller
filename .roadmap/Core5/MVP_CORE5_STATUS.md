# MVP Core 5 — Estado vivo (dash)

**Última actualización:** 2026-09-02  
**Rama:** `Core5`  
**Checklist:** [DASH_IMPLEMENTATION_CHECKLIST.md](./DASH_IMPLEMENTATION_CHECKLIST.md)

| Bloque | Estado |
|--------|--------|
| **B0** Baseline / inventario | **Cerrado** |
| **B1** Contrato agregados | **Cerrado** |
| **B2** UI resumen financiero | **Cerrado (código)** · smoke manual pendiente |
| B3 Desglose producto | **Siguiente (opcional completo)** |
| B4 Supervisión operativa | pendiente (opcional completo) |
| B5 Roles / CI / PR | pendiente (cierra mínimo con B2 smoke) |

### B2 UI

`FinanceSummaryPanel`: rango 7/30/90, KPIs + % margen, loading inicial / refresh sin blank, empty, error+retry, solo `loadSummary`, tips snapshot. Montado en `DashboardHome`.

### Siguiente

- Smoke manual B2 en staging (período con VERIFIED conocidos), **o**
- **B3** `aggregateByProduct` + UI top productos, **o**
- **B4** cola UNVERIFIED / aging.

Release mínimo: B0–B2 + B5 tras smoke + CI.
