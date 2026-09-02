# Core 4 — Audit de schema `sale_finance_event`

**Fecha:** 2026-09-01  
**Base código:** rama `Core4`  
**Colección Appwrite:** `sale_finance_event`  
**Decisión B0:** **Opción A** — `lines_json` en el mismo documento (MVP)

---

## 1. Contrato actual (Core 2 + Core 4)

### Dominio (`SaleFinanceEvent`)

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | string | p.ej. `fin_{saleId}` |
| `saleId` | string | 1:1 con venta |
| `revenue` | number ≥ 0 | |
| `cogs` | number ≥ 0 | Σ unitCostSnapshot × qty |
| `margin` | number | revenue − cogs |
| `userId` | string | staff / operador |
| `atIso` | string ISO | |
| `currency` | string? | de la venta |
| `lines` | `SaleFinanceLine[]` | Core 4; vacío en legacy |

### DTO Appwrite

| Atributo | Tipo código | Estado consola |
|----------|-------------|----------------|
| `sale_id` | string | existente |
| `revenue` | number | existente |
| `cogs` | number | existente |
| `margin` | number | existente |
| `user_id` | string | existente |
| `at` | string | existente |
| `currency` | string? | existente |
| **`lines_json`** | string? | **Provisionado + smoke OK 2026-09-01** |

---

## 2. Decisión: Opción A (cerrada)

```text
lines_json: string  // serialización de SaleFinanceLine[]
```

- Agregados `revenue` / `cogs` / `margin` = fuente de resúmenes.
- Docs legacy sin `lines_json` → `lines: []`.
- Opción B (colección `sale_finance_line`) **no** en release mínimo.

---

## 3. Acciones de consola / provisión

- [x] Verificar atributos reales vs DTO.
- [x] **Provisionar `lines_json`** (string, required = false).
- [x] Smoke create/read con líneas (panel 2026-09-01).
- [x] Índices: query por `sale_id` (ya usada).
- [ ] Permisos: create alineado a roles que confirman; cliente B2C sin write (revisar en B6).

---

## 4. Paridad operador (AlejoTaller)

- `SaleFinanceWrite.lines` + repo escribe `lines_json`.
- `ApplyOperatorStockDecisionCaseUse` pobla `lines` al VERIFIED (B3 código).

---

## 5. Criterio de cierre del audit (B0)

- [x] Tabla “actual vs propuesto” validada en código.
- [x] Decisión Opción A registrada.
- [x] Atributo **`lines_json`** provisionado y validado en runtime.
