# Core 4 — Audit de schema `sale_finance_event`

**Fecha:** 2026-09-01  
**Base código:** rama `Core4`  
**Colección Appwrite:** `sale_finance_event`  
**Decisión B0:** **Opción A** — `lines_json` en el mismo documento (MVP)

---

## 1. Contrato actual (Core 2)

### Dominio (`SaleFinanceEvent`) — post B1

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
| `currency` | string? | existente (verificar entornos) |
| **`lines_json`** | string? | **A PROVISIONAR** |

---

## 2. Decisión: Opción A (cerrada)

```text
lines_json: string  // serialización de SaleFinanceLine[]
```

```ts
interface SaleFinanceLine {
  productId: string
  quantity: number
  unitPrice: number
  unitCostSnapshot: number
  lineRevenue: number
  lineCogs: number
  lineMargin: number
}
```

- Agregados `revenue` / `cogs` / `margin` siguen siendo la fuente de resúmenes.
- Docs legacy sin `lines_json` → `lines: []` (compatible).
- Opción B (colección `sale_finance_line`) **no** en release mínimo.

---

## 3. Acciones de consola / provisión

- [ ] Verificar en Appwrite consola atributos reales vs DTO.
- [ ] **Provisionar `lines_json`** (string, size suficiente p.ej. 16384+; required = false).
- [ ] Índices: query por `sale_id` (ya usada); no índice de líneas en MVP.
- [ ] Permisos: create alineado a roles que confirman; cliente B2C sin write.
- [ ] Documentar gap si algún entorno no tiene `currency`.

---

## 4. Paridad operador (AlejoTaller)

- `SaleFinanceWrite.lines` + repo escribe `lines_json` cuando `lines` no está vacío.
- Case use operador debe **poblar** `lines` en B3 (tipos listos en B1).

---

## 5. Criterio de cierre del audit (B0)

- [x] Tabla “actual vs propuesto” validada en código.
- [x] Decisión Opción A registrada.
- [x] Lista de atributos a provisionar: **`lines_json`**.
