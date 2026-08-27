# Core 3 — Audit schema Appwrite vs código (B0)

**Fecha:** 2026-08-27  
**Rama:** `Core3`  
**Referencia docs:** `.roadmap/Core2/APPWRITE_CORE2_SCHEMA.md`  
**IDs código:** `src/core/infrastructure/appwrite/collections.ts`

## Collections usadas por compras

| Collection ID (código) | Uso |
|------------------------|-----|
| `supplier` | Proveedores |
| `purchase_entry` | Cabecera factura |
| `purchase_entry_line` | Líneas |
| `stock_movements` | Traza `entrada` (+ `entry_id`) |
| `product` | `existence`, `last_unit_cost` |

> Nota: el doc Core 2 menciona a veces `stock_movement` (singular). El código usa **`stock_movements`** (plural). La consola debe coincidir con el código.

---

## 1. `supplier` — estado real (confirmado usuario 2026-08-27)

| Atributo | Tipo consola | Required consola | Doc Core 2 | Código (post B0) |
|----------|--------------|------------------|-------------|------------------|
| `name` | Texto | **sí** | sí | `string` |
| `contact` | Texto | **sí** | no (doc desactualizado) | **write/read `string`** (vacío `""` permitido) |
| `notes` | Texto | no / NULL | no | `string \| undefined` |

### Gaps / decisiones

| Gap | Prioridad | Acción |
|-----|-----------|--------|
| Doc Core 2 decía `contact` optional | docs | Este audit + POLICY mandan; Appwrite real = required |
| Sin `active` / soft-delete | B1 opcional | Añadir `active: boolean` default true **o** borrar solo admin |
| Sin índice por `name` | B1 | Índice orderAsc ya usado en list; crear index en consola si falta |

**No cambiar** required de `contact` en consola en B0 si ya hay datos; el código ya envía `""`.

---

## 2. `purchase_entry`

| Atributo | Required (doc) | Código DTO |
|----------|----------------|------------|
| `supplier_id` | no | optional |
| `reference` | no | optional |
| `entry_date` | sí | required string |
| `total_cost` | sí | number |
| `currency` | sí | string |
| `user_id` | sí | string |
| `notes` | no | optional |
| `line_count` | sí | number (int en dominio) |

### Gaps Core 3

| Gap | Bloque | Notas |
|-----|--------|-------|
| Sin `status` (`active` \| `voided`) | B3 | Hace falta para anulación sin borrar documento |
| Sin `voided_at` / `voided_by` | B3 | Auditoría anulación |
| Filtros listado (fecha, supplier) | B2 | Repos ya listan; UI/filters pendientes |

---

## 3. `purchase_entry_line`

Alineado doc/código: `entry_id`, `product_id`, `quantity`, `unit_cost`, `concept`, `line_cost`.  
Sin gaps bloqueantes para B1–B2.

---

## 4. `stock_movements` + entrada

- `RegisterPurchaseEntryCaseUse` escribe `type: "entrada"`, `entryId` en dominio → `entry_id` en Appwrite.
- Verificar en consola que exista atributo **`entry_id`** (string, optional).
- Si falta `entry_id`, B2 (historial trazable) queda incompleto.

---

## 5. Checklist consola (B0 salida)

- [x] `supplier.name` required  
- [x] `supplier.contact` required (proyecto real)  
- [x] `supplier.notes` optional  
- [ ] Confirmar índices `purchase_entry`: `entry_date`, `supplier_id`, `user_id`  
- [ ] Confirmar `stock_movements.entry_id` existe  
- [ ] Confirmar `product.last_unit_cost` (float) existe  
- [ ] Permisos: cliente sin write en supplier / purchase_* / stock_movements  

Los ítems sin marcar son verificación manual en consola Appwrite (no automatizable desde el repo).

---

## 6. Ajuste de tipos en código (B0)

- `SupplierDTO.contact: string` — refleja required Appwrite.
- `supplierToDTO` siempre emite `contact: string` (nunca omite la clave).
- Dominio `Supplier.contact?: string` — `undefined` solo en memoria; al persistir → `""`.
