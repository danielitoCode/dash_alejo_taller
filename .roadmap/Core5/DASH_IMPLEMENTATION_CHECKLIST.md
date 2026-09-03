# Core 5 — Checklist de implementación · **dash_alejo_taller**

**Rama:** `Core5`  
**Última actualización:** 2026-09-02  
**Política:** [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) (**aceptada**)  
**Release mínimo:** B0 + B1 + B2 + B5. **Completo:** + B3 + B4.

---

## B0 — Baseline e inventario — **CERRADO** (2026-09-02)

- [x] Core 4 finance en `master` / base de rama
- [x] Política aceptada + inventario paths

**Salida B0:** hecha.

---

## B1 — Contrato de agregados (solo lectura) — **CERRADO** (2026-09-02)

- [x] `FinanceSummary` documentado
- [x] `aggregateFinanceSummary` solo documento
- [x] Tests: vacío, Σ N, legacy sin lines, NaN→0

**Salida B1:** hecha.

---

## B2 — UI resumen financiero (MVP) — **CERRADO** (2026-09-02)

- [x] Madurar `FinanceSummaryPanel.svelte`: rango 7/30/90, KPIs, loading inicial + refresh sin borrar KPIs, empty, error + reintentar
- [x] Solo `financeStore.loadSummary` (reconcile faltantes ya en store; tip aclara no recalcula eventos existentes)
- [x] Sin UI de “recalcular COGS”
- [x] Tips alineados snapshot Core 4 (`unitCostSnapshot`); % margen sobre ingresos
- [ ] Smoke manual período conocido (staging/prod — operador humano)

**Archivo:** `src/core/feature/finance/presentation/components/FinanceSummaryPanel.svelte`

**Salida B2 código:** hecha. Smoke manual pendiente de sesión.

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
B0 ✓ → B1 ✓ → B2 ✓ (smoke manual) → (B3 ∥ B4) → B5
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-02 | B0 cerrado |
| 2026-09-02 | B1 cerrado |
| 2026-09-02 | B2 UI madurada; smoke manual pendiente |
