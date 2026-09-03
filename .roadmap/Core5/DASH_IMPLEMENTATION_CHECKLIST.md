# Core 5 — Checklist de implementación · **dash_alejo_taller**

**Rama:** `Core5`  
**Última actualización:** 2026-09-02  
**Política:** [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) (**aceptada**)  
**Release mínimo:** B0 + B1 + B2 + B5. **Completo:** + B3 + B4.

---

## B0 — Baseline e inventario — **CERRADO** (2026-09-02)

- [x] Core 4 finance en `master` / base de rama:
  - [x] `SaleFinanceEvent` + `SaleFinanceLine` (`lines`, `unitCostSnapshot`)
  - [x] `buildFinanceEventFromSale`
  - [x] `RegisterSaleFinanceFromVerifiedCaseUse` idempotente (`getBySaleId` → no create)
- [x] [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) **aceptada**
  - [x] Evaluación `.policies/`: **no** redefine SALE/WAREHOUSE/EXCHANGE de dominio; sin impacto en tests de stock/confirm
  - [x] Puntero en `.policies/README.md` (lectura-only)
- [x] Inventario de lectura (paths reales):

| Pieza | Path |
|-------|------|
| Entidad | `src/core/feature/finance/domain/entity/SaleFinanceEvent.ts` |
| Build event | `src/core/feature/finance/domain/util/buildFinanceEventFromSale.ts` |
| Agregador | `src/core/feature/finance/domain/util/aggregateFinanceSummary.ts` |
| Register (write Core4) | `src/core/feature/finance/domain/caseuse/RegisterSaleFinanceFromVerifiedCaseUse.ts` |
| Store lectura + reconcile faltantes | `src/core/feature/finance/presentation/viewmodel/finance.store.ts` |
| UI resumen | `src/core/feature/finance/presentation/components/FinanceSummaryPanel.svelte` |
| Refresh post-confirm | `src/core/feature/sale/presentation/viewmodel/sale.store.ts` (`financeStore.loadSummary`) |
| Faltantes reconcile helper | `src/core/feature/finance/domain/util/salesMissingFinanceEvent.ts` |

- [x] STATUS: “B0 inventario OK” + paths

**Salida B0:** hecha.

---

## B1 — Contrato de agregados (solo lectura) — **CERRADO** (2026-09-02)

**Objetivo:** KPIs de período testeables sobre `SaleFinanceEvent[]`.

- [x] Revisar / documentar tipo `FinanceSummary` (revenue, cogs, margin, count, byCurrency) + JSDoc Core 5 B1
- [x] `aggregateFinanceSummary` = solo totales de documento; desglose producto → B3
- [x] Regla: sin `lines` → sin desglose producto inventado (agregador no lee `lines`)
- [x] Unit tests:
  - [x] Σ de N events = summary (+ byCurrency)
  - [x] Event legacy sin `lines` no rompe agregado documento
  - [x] Lista vacía → empty summary
  - [x] Números no finitos → 0

**Archivos**

| Acción | Path |
|--------|------|
| Agregador | `src/core/feature/finance/domain/util/aggregateFinanceSummary.ts` |
| Tests | `src/test/core/feature/finance/aggregateFinanceSummary.unit.test.ts` |

**Salida:** tests verdes de agregación. **Siguiente:** B2.

---

## B2 — UI resumen financiero (MVP)

- [ ] Madurar `FinanceSummaryPanel.svelte`: rango, KPIs, loading/empty/error
- [ ] Solo `financeStore.loadSummary` (reconcile faltantes ya en store)
- [ ] Sin UI de “recalcular COGS”
- [ ] Smoke manual período conocido

---

## B3 — Desglose por producto

- [ ] `aggregateByProduct(events)` desde `lines`
- [ ] UI top productos
- [ ] Unit; **prohibido** releer `last_unit_cost` para histórico

---

## B4 — Supervisión operativa

- [ ] UNVERIFIED count, aging, confirm/reject en período
- [ ] Bloque Operación ≠ Finanzas
- [ ] Enlaces a ventas existentes

---

## B5 — Roles, calidad, PR

- [ ] Roles de lectura
- [ ] Reportes no llaman register salvo reconcile documentado
- [ ] CI verde; PR `Core5` → `master`

---

## Orden

```text
B0 ✓ → B1 ✓ → B2 → (B3 ∥ B4) → B5
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-02 | Checklist DASH creado |
| 2026-09-02 | **B0 cerrado** |
| 2026-09-02 | **B1 cerrado** — contrato documento + tests legacy/NaN |
