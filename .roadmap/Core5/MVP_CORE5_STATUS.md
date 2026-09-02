# MVP Core 5 — Estado vivo (dash)

**Última actualización:** 2026-09-02  
**Rama:** `Core5`  
**Checklist:** [DASH_IMPLEMENTATION_CHECKLIST.md](./DASH_IMPLEMENTATION_CHECKLIST.md)

### B0 inventario OK

Core 4 en master verificado (`SaleFinanceEvent.lines`, `buildFinanceEventFromSale`, register idempotente).  
Política Core 5 **aceptada**; no redefine `.policies` de dominio (solo puntero README).

| Path | Rol |
|------|-----|
| `src/core/feature/finance/domain/entity/SaleFinanceEvent.ts` | Entidad + lines |
| `src/core/feature/finance/domain/util/buildFinanceEventFromSale.ts` | Build al confirm |
| `src/core/feature/finance/domain/util/aggregateFinanceSummary.ts` | KPIs documento + byCurrency |
| `src/core/feature/finance/domain/caseuse/RegisterSaleFinanceFromVerifiedCaseUse.ts` | Write idempotente |
| `src/core/feature/finance/presentation/viewmodel/finance.store.ts` | `loadSummary` + reconcile faltantes |
| `src/core/feature/finance/presentation/components/FinanceSummaryPanel.svelte` | UI resumen |
| `src/core/feature/sale/presentation/viewmodel/sale.store.ts` | refresh finance post-confirm |

| Bloque | Estado |
|--------|--------|
| **B0** Baseline / inventario | **Cerrado** |
| B1 Contrato agregados | **Siguiente** |
| B2 UI resumen | pendiente |
| B3 Desglose producto | pendiente |
| B4 Supervisión operativa | pendiente |
| B5 Roles / CI / PR | pendiente |

### Siguiente

**B1** — fortalecer/unitar `aggregateFinanceSummary` y dejar el contrato de lectura listo para UI (sin desglose producto aún; eso es B3).
