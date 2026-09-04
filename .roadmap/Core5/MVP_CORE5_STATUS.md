# MVP Core 5 — Estado vivo (dash)

**Última actualización:** 2026-09-04  
**Rama:** `Core5`  
**Checklist:** [DASH_IMPLEMENTATION_CHECKLIST.md](./DASH_IMPLEMENTATION_CHECKLIST.md)

| Bloque | Estado |
|--------|--------|
| **B0** Baseline | **Cerrado** |
| **B1** Agregados documento | **Cerrado** |
| **B2** UI resumen | **Cerrado** · smoke OK |
| **B3** Desglose producto | **Cerrado** |
| **B4** Supervisión operativa | **Cerrado** · smoke OK (confirm/reject/cola) |
| **B5** Roles / CI / PR | **Cerrado** · CI verde · falta merge → `master` |

### Cierre release

1. PR `Core5` → `master`
2. Merge con checks verdes
3. Arrancar **Core 6** (reservas) sobre `master` / rama nueva

### Principios cumplidos

- Lectura: `canViewCore5Reports` (staff panel)
- Write finance: solo confirm Core4 + reconcile faltantes
- Sin recalcular COGS histórico en UI
