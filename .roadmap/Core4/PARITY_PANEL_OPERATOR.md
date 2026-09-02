# Core 4 — Paridad panel (dash) vs operador (AlejoTaller scan)

**Fecha:** 2026-09-02 · rama `Core4`  
**Objetivo:** mismos campos semánticos al escribir `sale_finance_event`.

---

## Campos del documento

| Semántica | dash (`SaleFinanceEvent`) | AT (`SaleFinanceWrite` / Record) | Appwrite |
|-----------|---------------------------|----------------------------------|----------|
| Id evento | `id` | `id` (record) | `$id` |
| Venta | `saleId` | `saleId` | `sale_id` |
| Ingreso | `revenue` | `revenue` | `revenue` |
| COGS | `cogs` | `cogs` | `cogs` |
| Margen | `margin` | `margin` | `margin` |
| Actor | `userId` | `userId` | `user_id` |
| Instantánea | `atIso` | `atIso` | `at` |
| Moneda | `currency?` | `currency?` | `currency` |
| Líneas | `lines[]` | `lines[]` | `lines_json` (JSON string) |

## Campos por línea (`lines` / `lines_json`)

| Semántica | Nombre canónico (JSON) |
|-----------|-------------------------|
| Producto | `productId` |
| Cantidad | `quantity` |
| Precio unitario de línea | `unitPrice` |
| Costo congelado al confirm | `unitCostSnapshot` |
| Ingreso línea | `lineRevenue` |
| COGS línea | `lineCogs` |
| Margen línea | `lineMargin` |

AT acepta alias de lectura `product_id` / `unit_price` / `unit_cost_snapshot` al parsear; **escritura** usa camelCase canónico.

---

## Reglas de cálculo (ambos)

1. **Solo en VERIFIED** (confirm panel o `confirmed=true` operador).
2. **UNVERIFIED / DELETED / reject** → no create finance.
3. `unitCostSnapshot = last_unit_cost` al confirm; si falta → `0`.
4. `lineCogs = unitCostSnapshot × quantity`; `cogs = Σ lineCogs`.
5. `revenue` preferente = `sale.amount` si `> 0`; si no, Σ `unitPrice × qty`.
6. `margin` documento = `revenue − cogs` (no se fuerza a Σ `lineMargin` cuando hay descuento global en `amount`).
7. **Idempotencia:** un documento por `sale_id`; reintento no recalcula ni sobrescribe.

---

## Case uses

| Actor | Entry point |
|-------|-------------|
| Panel | `ConfirmSaleFromPanelCaseUse` → `RegisterSaleFinanceFromVerifiedCaseUse` → `buildFinanceEventFromSale` |
| Operador | `ApplyOperatorStockDecisionCaseUse` → `OperatorSaleFinanceRepository.createIdempotent` |

Cliente web / MCP: **sin** write a la colección.
