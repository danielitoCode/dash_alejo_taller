# MVP Core 4 — Estado vivo (dash)

**Última actualización:** 2026-09-01  
**Rama:** `Core4`  
**Core 4 (release mínimo):** **NO** — en implementación (B0–B3 código/smoke panel OK)  
**Base:** `master` @ apertura de rama

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema | **Cerrado** — Opción A (`lines_json`) |
| B1 Contrato dominio snapshot + líneas | **Hecho** |
| B2 Confirm panel con snapshot | **Cerrado** — smoke 2026-09-01 |
| B3 Confirm operador (AT) | **Código hecho** — smoke dispositivo pendiente |
| B4 Idempotencia + estabilidad histórica | **Siguiente** |
| B5 Tests + paridad | parcial (build/mapper/operador unit OK) |
| B6 Permisos + smoke residual + PR | pendiente |

### Smoke panel (B2) — verificado

- `lines_json` provisionado en `sale_finance_event`
- Confirm → documento con líneas:
  - producto con `last_unit_cost=2`, qty 3 → `lineCogs=6`, `unitCostSnapshot=2`
  - producto legacy sin costo → `unitCostSnapshot=0`
  - `cogs=6`, `margin=16.5` coherentes con revenue de líneas

### Siguiente (B4)

1. Tests/casos: segundo `RegisterSaleFinance` no recalcula ni duplica  
2. Tras VERIFIED, cambiar `last_unit_cost` del producto **no** muta el event  
3. Reconcile (si existe) solo crea faltantes

### Notas

- Trabajar **solo** en `Core4` hasta estable; merge a `master` con CI verde.
