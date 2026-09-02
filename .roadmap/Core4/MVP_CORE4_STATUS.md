# MVP Core 4 — Estado final (dash)

**Estado:** **CERRADO** (2026-09-02)  
**Rama:** `Core4`  
**PR merge:** https://github.com/danielitoCode/dash_alejo_taller/pull/21  
**Espejo AT:** https://github.com/danielitoCode/AlejoTaller/pull/28

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / schema | **Cerrado** |
| B1 Contrato snapshot + líneas | **Cerrado** |
| B2 Confirm panel + smoke | **Cerrado** |
| B3 Confirm operador (AT) | **Cerrado** (código + unit; smoke device opcional) |
| B4 Idempotencia / estabilidad | **Cerrado** |
| B5 Tests + paridad | **Cerrado** |
| B6 Frontera + unit + PRs | **Cerrado** a nivel producto |
| Merge `master` | Cuando CI PR #21 / #28 en verde |

### Criterio de cierre de producto

- Snapshot por línea en confirm (panel + operador).
- Histórico no se reescribe si cambia `last_unit_cost`.
- REJECT / DELETED / cliente / MCP no crean finance.
- Documentación y checklist unificado alineados.

### Post-merge operativo

1. CI verde → merge ambos PRs.  
2. Confirmar en Appwrite permisos de cliente sobre `sale_finance_event`.  
3. Core 5 puede consumir `sale_finance_event` como fuente canónica.
