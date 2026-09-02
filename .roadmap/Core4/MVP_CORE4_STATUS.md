# MVP Core 4 — Estado vivo (dash)

**Última actualización:** 2026-09-02  
**Rama:** `Core4`  
**Core 4 (release mínimo):** **NO** — en implementación (B0–B4 dash unit OK; B5 residual + B6)  
**Base:** `master` @ apertura de rama

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema | **Cerrado** — Opción A (`lines_json`) |
| B1 Contrato dominio snapshot + líneas | **Hecho** |
| B2 Confirm panel con snapshot | **Cerrado** — smoke 2026-09-01 |
| B3 Confirm operador (AT) | **Código hecho** — smoke dispositivo pendiente |
| B4 Idempotencia + estabilidad histórica | **Hecho (dash unit)** 2026-09-02 |
| B5 Tests + paridad | parcial (B4 register + missing-finance OK; residual margen/paridad) |
| B6 Permisos + smoke residual + PR | pendiente |

### Smoke panel (B2) — verificado

- `lines_json` provisionado en `sale_finance_event`
- Confirm → documento con líneas:
  - producto con `last_unit_cost=2`, qty 3 → `lineCogs=6`, `unitCostSnapshot=2`
  - producto legacy sin costo → `unitCostSnapshot=0`
  - `cogs=6`, `margin=16.5` coherentes con revenue de líneas

### B4 entregado (dash)

1. `RegisterSaleFinanceFromVerifiedCaseUse`: 2º `execute` no llama `create` ni recalcula con costos nuevos
2. Event congelado en repo no se muta aunque `last_unit_cost` vivo cambie
3. Reconcile (`salesMissingFinanceEvent` + `finance.store`): solo candidatos sin event; nunca overwrite

### Siguiente

1. **AT** reforzar test B4 en `createIdempotent` si hace falta  
2. B5 residual (margen doc vs Σ líneas; nota paridad)  
3. B6: smoke REJECT, permisos, CI, PRs coordinados

### Notas

- Trabajar **solo** en `Core4` hasta estable; merge a `master` con CI verde.
