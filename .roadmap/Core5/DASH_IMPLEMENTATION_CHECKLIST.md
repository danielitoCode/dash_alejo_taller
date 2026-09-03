# Core 5 — Checklist de implementación · **dash_alejo_taller**

**Rama:** `Core5`  
**Última actualización:** 2026-09-02  
**Política:** [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) (**aceptada**)  
**Release mínimo:** B0 + B1 + B2 + B5. **Completo:** + B3 + B4.

---

## B0 — Baseline e inventario — **CERRADO** (2026-09-02)

- [x] Core 4 finance + política + inventario paths

---

## B1 — Contrato de agregados — **CERRADO** (2026-09-02)

- [x] `FinanceSummary` + `aggregateFinanceSummary` + tests

---

## B2 — UI resumen financiero — **CERRADO** (2026-09-02)

- [x] `FinanceSummaryPanel` maduro (rango, KPIs, loading/empty/error)
- [x] Solo `loadSummary`; sin UI recalcular COGS
- [ ] Smoke manual período conocido

---

## B3 — Desglose por producto — **CERRADO** (2026-09-02)

- [x] `aggregateByProduct(events)` desde `lines` (snapshot; no `last_unit_cost`)
- [x] UI top productos (10) en `FinanceSummaryPanel`
- [x] Unit tests: vacío, legacy sin lines, suma multi-event, NaN, no usa revenue documento

**Archivos**

| Path | Rol |
|------|-----|
| `.../aggregateFinanceSummary.ts` | `aggregateByProduct` + `FinanceProductBucket` |
| `src/test/.../aggregateByProduct.unit.test.ts` | Unit B3 |
| `.../FinanceSummaryPanel.svelte` | Tabla top productos |

**Salida B3:** hecha.

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
B0 ✓ → B1 ✓ → B2 ✓ → B3 ✓ → B4 → B5
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-02 | B0–B3 cerrados (código); smoke B2 manual pendiente |
