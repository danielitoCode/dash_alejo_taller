# MVP Core 4 — Estado vivo (dash)

**Última actualización:** 2026-09-01  
**Rama:** `Core4`  
**Core 4 (release mínimo):** **NO** — en definición / implementación  
**Base:** `master` @ apertura de rama

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema | **Docs creados** — pendiente aceptación + decisión Opción A/B + provisión consola |
| B1 Contrato dominio snapshot + líneas | pendiente |
| B2 Confirm panel con snapshot | pendiente |
| B3 Confirm operador (AT) | pendiente (espejo) |
| B4 Idempotencia + estabilidad histórica | pendiente |
| B5 Tests + paridad | pendiente |
| B6 Permisos + smoke + PR | pendiente |

### Heredado de Core 2 (no rehacer)

- `sale_finance_event` al VERIFIED (panel + operador)
- COGS agregado = Σ `last_unit_cost × qty`
- Idempotencia por `sale_id`
- `UNVERIFIED` / `DELETED` sin finance
- `FinanceSummaryPanel` de lectura

### Gap prioritario Core 4

1. Snapshot **por línea** (`unit_cost_snapshot`) persistido  
2. Margen por línea  
3. Política + tests de no-reescribir histórico si cambia `last_unit_cost`  
4. Paridad explícita panel ↔ operador

### Smoke (cuando haya implementación)

| Flujo | Resultado |
|-------|-----------|
| Confirm panel → event + líneas | — |
| Reintento confirm → mismo event | — |
| Cambio `last_unit_cost` post-VERIFIED → event intacto | — |
| Reject / UNVERIFIED → sin event | — |
| Confirm operador → mismo contrato | — |

### Notas

- Trabajar **solo** en `Core4` hasta estable; merge a `master` con CI verde.
- Ideal: Core 3 ya en `master` antes del merge de Core 4 (costos de compra como base de `last_unit_cost`).
