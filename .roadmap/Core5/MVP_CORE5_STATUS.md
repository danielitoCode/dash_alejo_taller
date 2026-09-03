# MVP Core 5 — Estado vivo (dash)

**Última actualización:** 2026-09-02  
**Rama:** `Core5`  
**Checklist:** [DASH_IMPLEMENTATION_CHECKLIST.md](./DASH_IMPLEMENTATION_CHECKLIST.md)

### B0 inventario OK

Core 4 en master verificado (`SaleFinanceEvent.lines`, `buildFinanceEventFromSale`, register idempotente).  
Política Core 5 **aceptada**; no redefine `.policies` de dominio (solo puntero README).

### B1 contrato agregados OK

- `FinanceSummary` documentado (totales + `byCurrency`; **no** producto).
- `aggregateFinanceSummary` solo campos de documento; no lee `lines`.
- Tests: vacío, Σ N events, legacy `lines: []`, NaN→0, `financeRangeLastDays`.

| Path | Rol |
|------|-----|
| `src/core/feature/finance/domain/entity/SaleFinanceEvent.ts` | Entidad + lines |
| `src/core/feature/finance/domain/util/buildFinanceEventFromSale.ts` | Build al confirm |
| `src/core/feature/finance/domain/util/aggregateFinanceSummary.ts` | KPIs documento + byCurrency |
| `src/core/feature/finance/domain/caseuse/RegisterSaleFinanceFromVerifiedCaseUse.ts` | Write idempotente |
| `src/core/feature/finance/presentation/viewmodel/finance.store.ts` | `loadSummary` + reconcile faltantes |
| `src/core/feature/finance/presentation/components/FinanceSummaryPanel.svelte` | UI resumen |
| `src/core/feature/sale/presentation/viewmodel/sale.store.ts` | refresh finance post-confirm |
| `src/test/core/feature/finance/aggregateFinanceSummary.unit.test.ts` | B1 unit |

| Bloque | Estado |
|--------|--------|
| **B0** Baseline / inventario | **Cerrado** |
| **B1** Contrato agregados | **Cerrado** |
| B2 UI resumen | **Siguiente** |
| B3 Desglose producto | pendiente |
| B4 Supervisión operativa | pendiente |
| B5 Roles / CI / PR | pendiente |

### Siguiente

**B2** — madurar `FinanceSummaryPanel.svelte`: rango, KPIs, loading/empty/error; solo `financeStore.loadSummary`; sin UI “recalcular COGS”.
