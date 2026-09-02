# Core 5 — Supervisión y reportes

**Estado:** abierto · rama `Core5` · 2026-09-02  
**Dependencias:** Core 2–4 (`sale_finance_event` + snapshot)  
**Espejo AT:** [AlejoTaller/.roadmap/Core5](https://github.com/danielitoCode/AlejoTaller/tree/Core5/.roadmap/Core5)

## Objetivo

Supervisión operativa y reportes financieros en el **panel**, leyendo `sale_finance_event` (**sin** recalcular COGS ni reescribir histórico).

## Checklists de implementación (usar estos)

| Repo | Doc |
|------|-----|
| **Este (dash)** | [DASH_IMPLEMENTATION_CHECKLIST.md](./DASH_IMPLEMENTATION_CHECKLIST.md) |
| AlejoTaller | [AT_IMPLEMENTATION_CHECKLIST](https://github.com/danielitoCode/AlejoTaller/blob/Core5/.roadmap/Core5/AT_IMPLEMENTATION_CHECKLIST.md) |
| Índice | [CORE5_UNIFIED_CHECKLIST.md](./CORE5_UNIFIED_CHECKLIST.md) |

## Otros docs

| Doc | Rol |
|------|-----|
| [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) | Política |
| [MVP_CORE5_STATUS.md](./MVP_CORE5_STATUS.md) | Estado vivo |

## Orden (dash)

```text
B0 inventario → B1 agregados → B2 UI resumen → B3 producto ∥ B4 cola → B5 PR
```

## Fuera de alcance

Contabilidad formal, impuestos, anulación VERIFIED, reportes B2C, Core 6 reservas taller.
