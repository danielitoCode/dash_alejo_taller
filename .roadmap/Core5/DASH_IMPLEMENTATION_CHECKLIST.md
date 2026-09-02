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

**Salida B0:** hecha. **Siguiente:** B1.

---

## B1 — Contrato de agregados (solo lectura)

**Objetivo:** KPIs de período testeables sobre `SaleFinanceEvent[]`.

- [ ] Revisar / documentar tipo `FinanceSummary` (ya: revenue, cogs, margin, count, byCurrency)
- [ ] Extender o envolver `aggregateFinanceSummary` según gaps Core 5 (p. ej. desglose producto → B3)
- [ ] Regla: sin `lines` → sin desglose producto inventado
- [ ] Unit tests:
  - [ ] Σ de N events = summary
  - [ ] Event legacy sin `lines` no rompe agregado documento
  - [ ] Lista vacía → empty summary

**Archivos**

| Acción | Path |
|--------|------|
| Agregador | `.../aggregateFinanceSummary.ts` |
| Tests | `src/test/core/feature/finance/aggregateFinanceSummary.unit.test.ts` |

**Salida:** tests verdes de agregación.

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
B0 ✓ → B1 → B2 → (B3 ∥ B4) → B5
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-02 | Checklist DASH creado |
| 2026-09-02 | **B0 cerrado** |
