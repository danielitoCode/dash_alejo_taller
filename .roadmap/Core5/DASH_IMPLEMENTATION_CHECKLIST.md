# Core 5 — Checklist de implementación · **dash_alejo_taller**

**Rama:** `Core5`  
**Última actualización:** 2026-09-03  
**Política:** [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) (**aceptada**)  
**Release mínimo:** B0 + B1 + B2 + B5. **Completo:** + B3 + B4.

---

## B0–B4 — **CERRADOS** (2026-09-02)

Ver historial en commits `Core5`. B2 smoke manual sigue recomendado en staging.

---

## B5 — Roles, calidad, PR — **CERRADO** (código · 2026-09-03)

- [x] Roles de lectura: `canViewCore5Reports` ≡ staff dashboard (owner/admin/sales); viewer no
- [x] Reportes **no** llaman `register` salvo `finance.store.reconcileMissing` (faltantes VERIFIED; idempotente Core4)
- [x] UI finance/ops solo `loadSummary` / lectura `saleStore` — sin “recalcular COGS”
- [x] Workflow `core5-reports-unit.yml` ampliado (finance + ops + RoleConfig Core5)
- [x] CI general `ci.yml` ya incluye rama `Core5` (check + unit + build)
- [ ] CI verde en Actions tras push/PR (validar en GitHub)
- [ ] PR `Core5` → `master` abierto y merge cuando checks pasen

**Salida B5 código:** hecha. **Falta:** checks Actions + merge PR.

---

## Orden

```text
B0 ✓ → B1 ✓ → B2 ✓ → B3 ✓ → B4 ✓ → B5 ✓ (código) → CI + merge
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-02 | B0–B4 código |
| 2026-09-03 | B5 roles + frontera write + workflow + PR |
