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

- [x] `FinanceSummaryPanel` maduro
- [ ] Smoke manual período conocido

---

## B3 — Desglose por producto — **CERRADO** (2026-09-02)

- [x] `aggregateByProduct` + UI top productos + tests

---

## B4 — Supervisión operativa — **CERRADO** (2026-09-02)

- [x] UNVERIFIED count + aging (fresh / warn / critical) via `aggregateSaleOperations`
- [x] Confirmados / rechazados en período (30d)
- [x] Bloque Operación ≠ Finanzas (`OperationsSupervisionPanel` separado de `FinanceSummaryPanel`)
- [x] Enlaces a Ventas + detalle (`sales` / `sales-detail`)
- [x] Unit tests cola / aging / período

**Archivos**

| Path | Rol |
|------|-----|
| `src/core/feature/sale/domain/util/aggregateSaleOperations.ts` | KPIs operativos |
| `src/test/core/feature/sale/aggregateSaleOperations.unit.test.ts` | Unit |
| `src/core/feature/sale/presentation/components/OperationsSupervisionPanel.svelte` | UI |
| `src/core/infrastructure/presentation/routes/DashboardHome.svelte` | Montaje (antes de finanzas) |

**Salida B4:** hecha.

---

## B5 — Roles, calidad, PR

- [ ] Roles de lectura
- [ ] Reportes no llaman register salvo reconcile documentado
- [ ] CI verde; PR `Core5` → `master`

---

## Orden

```text
B0 ✓ → B1 ✓ → B2 ✓ → B3 ✓ → B4 ✓ → B5
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-02 | B0–B4 cerrados (código); smoke B2 manual pendiente |
