# Core 2 — Schema Appwrite (configurar en consola)

**Rama:** `Core2`  
**Fecha:** 2026-08-13  
**Database:** la misma que Core 1 (`VITE_APPWRITE_DATABASE_ID`)

> Soft-hold Core 1 **no cambia**. Solo se añaden atributos/collections.

## 1. Collection existente `product` — atributo nuevo

| Atributo | Tipo | Required | Default | Notas |
|----------|------|----------|---------|--------|
| `last_unit_cost` | double (float) | no | — | Último costo de compra; base COGS. Si falta → tratar como 0 |

**Índices:** no obligatorios para MVP.

**Permisos:** mismos que ya tiene `product` (staff read/write según roles actuales).

---

## 2. Collection `supplier`

| Atributo | Tipo | Required | Size | Notas |
|----------|------|----------|------|--------|
| `name` | string | sí | 128 | |
| `contact` | string | no | 256 | |
| `notes` | string | no | 1024 | |

**Collection ID:** `supplier`  
**Permisos sugeridos:** role staff (owner/admin/sales) read/create/update; delete owner/admin.

---

## 3. Collection `purchase_entry` (cabecera factura de entrada)

| Atributo | Tipo | Required | Notas |
|----------|------|----------|--------|
| `supplier_id` | string | no | null si regalía sin proveedor |
| `reference` | string | no | nº factura proveedor |
| `entry_date` | datetime | sí | |
| `total_cost` | double | sí | suma de líneas (≥ 0) |
| `currency` | string | sí | ej. `CUP`, `USD` |
| `user_id` | string | sí | staff que registró |
| `notes` | string | no | |
| `line_count` | integer | sí | |

**Collection ID:** `purchase_entry`  
**Índices:** `entry_date`, `supplier_id`, `user_id`

---

## 4. Collection `purchase_entry_line`

| Atributo | Tipo | Required | Notas |
|----------|------|----------|--------|
| `entry_id` | string | sí | → `purchase_entry.$id` |
| `product_id` | string | sí | → `product.$id` |
| `quantity` | integer | sí | > 0 |
| `unit_cost` | double | sí | ≥ 0 |
| `concept` | string (enum) | sí | `purchase` \| `royalty` \| `other` |
| `line_cost` | double | sí | qty × unit_cost |

**Collection ID:** `purchase_entry_line`  
**Índices:** `entry_id`, `product_id`

---

## 5. Collection `stock_movement`

| Atributo | Tipo | Required | Notas |
|----------|------|----------|--------|
| `product_id` | string | sí | |
| `type` | string (enum) | sí | `entrada` \| `salida_venta` \| `ajuste` \| `devolucion` |
| `quantity` | integer | sí | siempre > 0 |
| `balance_after` | integer | sí | existence tras el movimiento |
| `reason` | string | sí | |
| `user_id` | string | sí | |
| `sale_id` | string | no | si aplica |
| `entry_id` | string | no | si viene de purchase_entry |
| `created_at_iso` | string | no | redundante con `$createdAt`; opcional |

**Collection ID:** `stock_movement`  
**Índices:** `product_id`, `type`, `$createdAt`

> Nombre de collection en singular para alinear con `product` / `sale`.

---

## 6. Collection `sale_finance_event`

| Atributo | Tipo | Required | Notas |
|----------|------|----------|--------|
| `sale_id` | string | sí | |
| `revenue` | double | sí | ingreso al VERIFIED |
| `cogs` | double | sí | Σ last_unit_cost × qty por línea |
| `margin` | double | sí | revenue − cogs |
| `user_id` | string | sí | quien confirmó |
| `at` | datetime | sí | momento del evento |
| `currency` | string | no | del Sale |

**Collection ID:** `sale_finance_event`  
**Índices:** `sale_id` (unique recomendado para idempotencia), `at`

---

## 7. Permisos globales (MVP)

| Collection | Cliente B2C | Operador | Dash staff |
|------------|-------------|----------|------------|
| product (+ last_unit_cost) | read (si ya aplica) | read/write stock paths | read/write |
| supplier | no | read | CRUD staff |
| purchase_entry / line | no | read opcional | create/read staff |
| stock_movement | no | create en confirm opcional | create/read |
| sale_finance_event | no | create en confirm | create/read |

Ajustar en Appwrite Teams/Roles según el proyecto real.

---

## 8. Checklist de configuración (consola)

- [ ] Añadir `last_unit_cost` (float) a `product`
- [ ] Crear `supplier`
- [ ] Crear `purchase_entry`
- [ ] Crear `purchase_entry_line`
- [ ] Crear `stock_movement`
- [ ] Crear `sale_finance_event`
- [ ] Índices listados
- [ ] Permisos por rol
- [ ] Probar create Document de prueba en cada collection

Código dash alineado: `src/core/feature/{product,inventory,purchase,finance}/`
