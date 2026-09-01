# Core 4 — Política de finanzas de venta

**Estado:** borrador operativo · rama `Core4` · 2026-09-01  
**Aplica a:** `dash_alejo_taller` (panel) y `AlejoTaller` (operador scan).  
**No aplica a:** cliente B2C web (solo crea `UNVERIFIED`; no escribe finance).

---

## 1. Principio

El dinero de la venta se reconoce **solo al confirmar** (`UNVERIFIED → VERIFIED`).  
El costo usado para COGS se **congela** en ese instante (snapshot).  
Cambios posteriores de `product.last_unit_cost` **no** alteran eventos ya escritos.

```text
UNVERIFIED  → sin sale_finance_event, sin ingreso
VERIFIED    → sale_finance_event (revenue, cogs, margin + líneas con unit_cost_snapshot)
DELETED     → sin sale_finance_event, sin ingreso
```

---

## 2. Quién escribe `sale_finance_event`

| Actor | Puede crear finance | Notas |
|-------|---------------------|--------|
| Panel (owner/admin/sales) vía `ConfirmSaleFromPanelCaseUse` | Sí | Tras stock `salida_venta` |
| Operador (scan) vía `ApplyOperatorStockDecisionCaseUse` | Sí | Mismo contrato de campos |
| Cliente web / app | **No** | Solo `UNVERIFIED` |
| MCP / tools B2C | **No** | |

---

## 3. Cálculo

### 3.1 Revenue

- Preferente: `sale.amount` si es finito y `> 0`.
- Fallback: `Σ line.price × line.quantity`.
- Moneda: la de la venta (`sale.currency`).

### 3.2 COGS (método Core 2 + Core 4)

- Método de costo: **último costo** (`last_unit_cost` del producto **en el momento del confirm**).
- Por línea: `unit_cost_snapshot = last_unit_cost` (o `0` si ausente / no finito).
- `line_cogs = unit_cost_snapshot × quantity`.
- `cogs` documento = `Σ line_cogs`.

### 3.3 Margen

- Documento: `margin = revenue − cogs`.
- Línea: `line_margin = line_revenue − line_cogs` (si se persiste detalle).

### 3.4 Snapshot

- El valor de costo **debe quedar almacenado** en el evento (agregado ya existe vía `cogs`; Core 4 exige además **por línea** `unit_cost_snapshot`).
- Re-lectura de `product.last_unit_cost` **después** del confirm **no** se usa para reescribir el evento.

---

## 4. Idempotencia

- Clave natural: **un evento por `sale_id`**.
- Si ya existe documento para ese `sale_id` → devolver existente; **no** crear segundo ni recalcular.
- Reconfirm accidental, reintento de red o reconcile de resumen → mismo resultado.

---

## 5. Relación con stock (no mezclar)

| Evento | Stock | Finance |
|--------|-------|---------|
| Soft-hold (UNVERIFIED) | `reserved +=` | No |
| Confirm (VERIFIED) | `existence -=`, `reserved -=`, movement `salida_venta` | Sí |
| Reject (DELETED) | `reserved -=` | No |

Finance **no** modifica inventario. Stock **no** recalcula revenue.

---

## 6. Relación con compras (Core 3)

- `last_unit_cost` se actualiza en entradas de compra (concepto compra).
- Anular una entrada (B3.1) **no** modifica `last_unit_cost` ni eventos financieros ya emitidos.
- Core 4 asume que el costo leído al confirm es el vigente en producto; no reabre facturas de compra.

---

## 7. Moneda

- El evento guarda `currency` de la venta.
- Costos de producto en panel se alinean a la política de Core 3 (USD canónico en abastecimiento cuando aplique).
- No convertir de nuevo al confirmar si el snapshot ya está en la unidad de costo del producto; documentar en schema si hay desajuste detectado.

---

## 8. Lectura y reportes

- Resúmenes operativos leen **solo** `sale_finance_event` (y agregados derivados).
- **Prohibido** inventar una segunda tabla de “ingresos recalculados” que mute stock o reescriba eventos.
- Core 5 consumirá esta fuente; Core 4 no implementa KPIs avanzados.

---

## 9. Fuera de política (explícito)

- Contabilidad de doble partida.
- Impuestos / retenciones.
- Reversión financiera de una venta ya VERIFIED (scope futuro si se define anulación de venta).
- FIFO/LIFO por lote.
