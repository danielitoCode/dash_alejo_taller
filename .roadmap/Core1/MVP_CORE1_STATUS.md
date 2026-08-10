# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-10  
**Veredicto:** **Fase 6 completa en código** (6.1 + 6.3) + runbook 6.2. Ejecución smoke y QA formal pendientes.

## Fase 6 — Coherencia + smoke + cache local

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **6.1** No B2C / no segundo hold / no verify sin stock | **Hecho** | Policy + guards |
| **6.2** Smoke tienda → dash | **Runbook** · ejecución ☐ | [`SMOKE_6_2.md`](./SMOKE_6_2.md) |
| **6.3** Espejo Dexie post `applyStockDeltas` | **Hecho** | [`PHASE_6_3.md`](./PHASE_6_3.md) |

## Alineación Core 1 (código)

| Área | Estado |
|------|--------|
| Modelo reserved/available | ✓ |
| Catálogo existence ≥ reserved | ✓ |
| Roles staff | ✓ |
| Ventas currency + filtros | ✓ |
| Confirm/reject + stock | ✓ |
| No origen B2C / no segundo hold | ✓ |
| Cache local post-decisión | ✓ |
| Smoke cruzado documentado | ✓ (ejecución pendiente) |

```bash
npm run test:unit
```

**Siguiente:** ejecutar [`SMOKE_6_2.md`](./SMOKE_6_2.md) en staging → [`QA_CORE1_CHECK_plan.md`](./QA_CORE1_CHECK_plan.md).
