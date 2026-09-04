# Core 5 — Checklist de implementación · **dash_alejo_taller**

**Rama:** `Core5`  
**Última actualización:** 2026-09-04  
**Política:** [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) (**aceptada**)  
**Release mínimo:** B0 + B1 + B2 + B5. **Completo:** + B3 + B4.

---

## B0–B4 — **CERRADOS** (2026-09-02)

| Bloque | Contenido |
|--------|-----------|
| **B0** | Baseline finance Core4 + política supervisión |
| **B1** | `aggregateFinanceSummary` contrato + tests |
| **B2** | `FinanceSummaryPanel` (rango, KPIs, loading/empty) |
| **B3** | `aggregateByProduct` + top productos UI |
| **B4** | `OperationsSupervisionPanel` (cola UNVERIFIED, aging, confirm/reject 30d) |

---

## B5 — Roles, calidad, PR — **CERRADO** (2026-09-04)

- [x] Roles de lectura: `canViewCore5Reports` ≡ staff dashboard (owner/admin/sales); viewer no
- [x] Reportes **no** llaman `register` salvo `finance.store.reconcileMissing` (faltantes VERIFIED; idempotente Core4)
- [x] UI finance/ops solo `loadSummary` / lectura `saleStore` — **sin** botón “recalcular COGS”
- [x] Workflow `core5-reports-unit.yml` ampliado (finance + ops + RoleConfig Core5)
- [x] CI general `ci.yml` incluye rama `Core5` (check + unit + build)
- [x] **CI verde** en Actions (`Core5`)
- [x] Smoke manual: confirm/reject actualiza pendientes + confirmados/rechazados; cola ≤7; finance OK
- [x] Fixes post-smoke: `$saleStore` reactivo, `touchActivity` + `nowMs` fresco, markup CI
- [ ] PR `Core5` → `master` mergeado (abrir / merge cuando checks del PR pasen)

**Salida B5:** código + CI + smoke **OK**. Falta solo merge a `master`.

---

## Orden

```text
B0 ✓ → B1 ✓ → B2 ✓ → B3 ✓ → B4 ✓ → B5 ✓ → CI ✓ → smoke ✓ → merge master → Core6
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-02 | B0–B4 código |
| 2026-09-03 | B5 roles + frontera write + workflow |
| 2026-09-04 | CI verde · smoke ops/finance · fixes panel · checklist cierre |
