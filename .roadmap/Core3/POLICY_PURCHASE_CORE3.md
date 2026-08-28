# Core 3 — Política de compras y abastecimiento

**Fecha:** 2026-08-28  
**Rama:** `Core3`  
**Estado:** aceptada para B0 (baseline) + moneda (ver POLICY_CURRENCY_CORE3)  
**No altera** soft-hold Core 1 ni COGS Core 2 (`last_unit_cost × qty` al VERIFIED).

## 1. Quién escribe

| Actor | `supplier` | `purchase_entry` / líneas | `stock_movements` tipo `entrada` |
|-------|------------|---------------------------|----------------------------------|
| Cliente B2C (web/app/MCP) | No | No | No |
| Operador (`alejotallerscan`) | No (lectura no requerida) | No | Solo vía confirm venta (`salida_venta`) |
| Dash staff (sales+) | CRUD según rol | Create + read | Create al registrar entrada |
| Dash viewer | Solo lectura | Solo lectura | Solo lectura |
| Owner/admin | CRUD + anulación (B3) | CRUD + anulación (B3) | Create |

## 2. Proveedor (`supplier`)

- **Obligatorio en dominio de negocio:** `name` (no vacío).
- **Appwrite (proyecto real, 2026-08-27):** `name` required, **`contact` required**, `notes` optional.
- Si el staff no tiene contacto real, el panel persiste `contact: ""` (string vacío). El dominio puede tratar vacío como “sin contacto”.
- `purchase_entry.supplier_id` sigue siendo **opcional** (regalía / entrada sin proveedor).
- Core 3 B1: UI CRUD de proveedores; desactivación (`active`) es **gap** hasta decidir soft-delete (ver SCHEMA_AUDIT).

## 3. Factura de entrada (ya Core 2 · se mantiene)

- Única vía de **alta de stock** en panel: `RegisterPurchaseEntryCaseUse`.
- Por cada línea: `existence += qty`, movement `type: "entrada"` con `entry_id`, y si `concept === "purchase"` y `unitCost > 0` → actualiza `last_unit_cost`.
- Tras cualquier cambio de stock: **`existence >= reserved`** (nunca violar soft-hold).
- Líneas: `quantity` entero > 0, `unit_cost` ≥ 0, `concept` ∈ `purchase | royalty | other`.
- **Moneda:** ver [`POLICY_CURRENCY_CORE3.md`](./POLICY_CURRENCY_CORE3.md).  
  - Default **USD**.  
  - `last_unit_cost` del producto **siempre en USD**.  
  - Si `currency = CUP`, convertir con tasa del momento antes de escribir `last_unit_cost`.

## 4. Inmutabilidad vs anulación (B3 — no implementar en B0)

- Las entradas **confirmadas** no se editan línea a línea en caliente en B0–B2.
- **Anulación/corrección** (B3): solo owner/admin; debe escribir traza compensatoria; **prohibido** si el resultado dejaría `existence < reserved`.
- Hasta B3 no existe `status` en `purchase_entry` en producción (gap documentado).

## 5. Auditoría mínima

Toda entrada debe permitir reconstruir:

- quién (`user_id`)
- cuándo (`entry_date` / `$createdAt`)
- proveedor (`supplier_id` o ausencia)
- costos por línea y `total_cost`
- moneda (`currency`)
- si CUP: tasa, momento y fuente del cambio
- movements ligados por `entry_id`

## 6. Tipos (contrato código ↔ Appwrite)

| Campo Appwrite | Tipo | Required en consola | Código dominio |
|----------------|------|---------------------|----------------|
| `name` | string | sí | `string` obligatorio |
| `contact` | string | **sí** (real) | write siempre `string` (puede ser `""`); read `string` |
| `notes` | string | no | `string \| undefined` |

Evitar `null` en writes de `contact` (Appwrite required). Preferir `""`.

## 7. Relación con AlejoTaller

- Monorepo **no** expone UI ni tools MCP de compras.
- Operador solo consume `last_unit_cost` al VERIFIED; nuevas entradas en dash no requieren cambio de operador si el campo se actualiza en `product` en **USD**.
