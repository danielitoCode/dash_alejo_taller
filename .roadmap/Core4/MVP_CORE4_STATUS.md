# MVP Core 4 — Estado vivo (dash)

**Última actualización:** 2026-09-02  
**Rama:** `Core4`  
**Core 4 (release mínimo):** **casi** — B0–B5 hechos; falta B6 (smoke REJECT, permisos, CI, PRs)  
**Base:** `master` @ apertura de rama

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema | **Cerrado** — Opción A (`lines_json`) |
| B1 Contrato dominio snapshot + líneas | **Hecho** |
| B2 Confirm panel con snapshot | **Cerrado** — smoke 2026-09-01 |
| B3 Confirm operador (AT) | **Código + unit** — smoke dispositivo opcional |
| B4 Idempotencia + estabilidad histórica | **Hecho (BOTH unit)** 2026-09-02 |
| B5 Tests + paridad | **Hecho** 2026-09-02 |
| B6 Permisos + smoke residual + PR | **Siguiente** |

### B5 entregado

- Unit: `margin = Σ lineMargin` cuando `revenue = Σ lineRevenue`
- Unit: si `sale.amount` (descuento) ≠ suma de líneas → `margin = amount − cogs` (documentado; no se reescalan líneas)
- [PARITY_PANEL_OPERATOR.md](./PARITY_PANEL_OPERATOR.md) campos canónicos panel ↔ operador
- POLICY §3.3 actualizado

### Siguiente (B6)

1. Smoke REJECT no crea event  
2. Revisar permisos Appwrite (cliente sin write finance)  
3. CI verde + PRs `Core4` → `master` coordinados  

### Notas

- Trabajar **solo** en `Core4` hasta estable; merge a `master` con CI verde.
