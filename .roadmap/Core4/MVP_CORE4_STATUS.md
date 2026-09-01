# MVP Core 4 — Estado vivo (dash)

**Última actualización:** 2026-09-01  
**Rama:** `Core4`  
**Core 4 (release mínimo):** **NO** — en implementación  
**Base:** `master` @ apertura de rama

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema | **Cerrado** — Opción A (`lines_json`) |
| B1 Contrato dominio snapshot + líneas | **Hecho** — entidad, builder, mapper, tests; tipos AT |
| B2 Confirm panel con snapshot | pendiente (+ provisionar `lines_json` en Appwrite) |
| B3 Confirm operador (AT) | pendiente (rellenar `lines` en case use) |
| B4 Idempotencia + estabilidad histórica | pendiente |
| B5 Tests + paridad | parcial (build + mapper OK) |
| B6 Permisos + smoke + PR | pendiente |

### Heredado de Core 2 (no rehacer)

- `sale_finance_event` al VERIFIED (panel + operador)
- COGS agregado = Σ `last_unit_cost × qty`
- Idempotencia por `sale_id`
- `UNVERIFIED` / `DELETED` sin finance
- `FinanceSummaryPanel` de lectura

### Hecho en B1

- `SaleFinanceLine` + `lines` en `SaleFinanceEvent`
- `buildFinanceEventFromSale` rellena `unitCostSnapshot` por producto
- DTO/mapper `lines_json` (legacy sin campo → `lines: []`)
- AT: `SaleFinanceLineWrite`, `SaleFinanceWrite.lines`, repo serializa/parsea `lines_json`

### Siguiente (B2)

1. Provisionar en Appwrite consola atributo **`lines_json`** (string) en `sale_finance_event`  
2. Verificar que confirm panel ya pasa por `buildFinanceEventFromSale` (debería escribir líneas automáticamente)  
3. Smoke create/read

### Notas

- Trabajar **solo** en `Core4` hasta estable; merge a `master` con CI verde.
- Ideal: Core 3 ya en `master` antes del merge de Core 4.
