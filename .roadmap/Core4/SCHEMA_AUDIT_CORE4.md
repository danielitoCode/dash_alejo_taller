# Core 4 — Audit de schema `sale_finance_event`

**Fecha:** 2026-09-01  
**Base código:** `master` / rama `Core4`  
**Colección Appwrite:** `sale_finance_event` (nombre lógico del dominio)

---

## 1. Contrato actual (Core 2)

### Dominio (`SaleFinanceEvent`)

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | string | p.ej. `fin_{saleId}` |
| `saleId` | string | 1:1 con venta |
| `revenue` | number ≥ 0 | |
| `cogs` | number ≥ 0 | Σ last_unit_cost × qty al confirm |
| `margin` | number | revenue − cogs |
| `userId` | string | staff / operador |
| `atIso` | string ISO | |
| `currency` | string? | de la venta |

### DTO Appwrite (`SaleFinanceEventDTO`)

| Atributo | Tipo código |
|----------|-------------|
| `sale_id` | string |
| `revenue` | number |
| `cogs` | number |
| `margin` | number |
| `user_id` | string |
| `at` | string |
| `currency` | string? |

### Lo que **no** existe hoy

| Necesidad Core 4 | Estado |
|------------------|--------|
| `unit_cost_snapshot` por línea | **Ausente** — solo total `cogs` |
| Detalle de líneas (product_id, qty, price, unit_cost_snapshot, line_cogs, line_margin) | **Ausente** |
| Flag / versión de contrato (`schema_version`) | **Ausente** (opcional) |

**Nota:** el total `cogs` ya es un snapshot *agregado* (no se reescribe al cambiar el producto). El gap es **trazabilidad por línea** y reproducibilidad sin re-leer el catálogo.

---

## 2. Propuesta de extensión (Core 4)

### Opción A — JSON de líneas en el mismo documento (preferida MVP)

Añadir atributo string (JSON) o array si Appwrite lo permite de forma estable:

```text
lines_json: string  // serialización de SaleFinanceLine[]
```

```ts
interface SaleFinanceLine {
  productId: string
  quantity: number
  unitPrice: number          // precio venta de la línea
  unitCostSnapshot: number   // last_unit_cost al confirm
  lineRevenue: number        // unitPrice × quantity
  lineCogs: number           // unitCostSnapshot × quantity
  lineMargin: number         // lineRevenue − lineCogs
}
```

- `revenue` / `cogs` / `margin` del documento siguen siendo la fuente de agregados.
- `lines_json` es el detalle auditable.
- Sin colección extra → menos permisos y menos writes.

### Opción B — Colección `sale_finance_line`

Solo si el volumen o las queries por producto lo exigen (posible Core 5). **No** es requisito del release mínimo Core 4.

---

## 3. Acciones de consola / provisión

- [ ] Verificar en Appwrite consola atributos reales vs DTO.
- [ ] Si se adopta Opción A: provisionar `lines_json` (string, size suficiente) o atributo equivalente.
- [ ] Índices: único lógico por `sale_id` (query `getBySaleId`); no hace falta índice de líneas en MVP.
- [ ] Permisos: create/update alineados a roles que confirman ventas; cliente B2C sin write.
- [ ] Documentar gap si algún entorno de staging no tiene `currency`.

---

## 4. Paridad operador (AlejoTaller)

Hoy el operador escribe los mismos campos agregados vía `SaleFinanceWrite` + `createIdempotent`.  
Core 4 debe extender el write del operador con el **mismo** detalle de líneas/snapshot para no diverger del panel.

---

## 5. Criterio de cierre del audit (B0)

- [ ] Tabla “actual vs propuesto” validada en código.
- [ ] Decisión Opción A vs B registrada en checklist.
- [ ] Lista de atributos a provisionar en consola (si aplica) lista antes de B1 implementación.
