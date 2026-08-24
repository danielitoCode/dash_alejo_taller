# Core 2 — Deltas de política (respecto a Core 1)

**Fecha original:** 2026-08-13  
**Actualización cierre:** 2026-08-24  
**Estado:** **vigente / aceptada** en dash + AlejoTaller  
**Fuente Core 1:** [`../Core1/CANONICAL_RULES_FREEZE.md`](../Core1/CANONICAL_RULES_FREEZE.md)  
**Canónico ecosistema:** `AlejoTaller/.policies/warehouse`, `AlejoTaller/.policies/sale`

## Congelado (no negociable en Core 2)

| Regla | Detalle |
|-------|---------|
| Soft-hold | `available = max(0, existence − reserved)` |
| UNVERIFIED | Solo cliente; `reserved += qty`; `existence` intacto |
| VERIFIED | `existence -= qty` y `reserved -= qty` |
| DELETED / reject | Solo `reserved -= qty` |
| Panel no crea B2C | Sin ventas UNVERIFIED desde el dash |
| `reserved` no se edita a mano | Solo vía flujo de venta o release |

## Añadido en Core 2

### 1. `stock_movements` (traza)

| type | Efecto en `existence` | Quién |
|------|----------------------|--------|
| `entrada` | `+= quantity` | staff (dash; preferible vía factura) |
| `salida_venta` | `-= quantity` | al VERIFIED (operador **o** dash — paridad) |
| `ajuste` | ± según dirección | staff; post-ajuste `existence ≥ reserved` |
| `devolucion` | `+= quantity` | staff; solo post-VERIFIED |

Campos mínimos: `product_id`, `type`, `quantity` (>0), `balance_after`, `reason`, `user_id`, `sale_id?`, `created_at`.

### 2. Entrada de mercancía (política UI 2026-08-24)

- **Única vía de alta de stock en panel:** factura de entrada multi-línea (`purchase_entry` + lines).
- Actualiza `existence`, escribe `stock_movements` tipo `entrada`, y `last_unit_cost` cuando aplica.
- Producto nuevo se puede definir **dentro** de la factura (luego stock + costo en el mismo flujo).
- Alta de catálogo suelta: **existence = 0** (sin inventar stock ni costos).
- Atajo «Dar entrada» por ítem: **retirado** de la UI (no alineado a finanzas Core 2).

### 3. Devolución formal

- Solo sobre venta **VERIFIED**.  
- `existence += qty` + movimiento `devolucion` + motivo obligatorio.  
- **No** reabrir el soft-hold de esa venta.

### 4. Ajuste de inventario

- Motivo + `user_id` obligatorios.  
- Validación: tras el ajuste, `existence >= reserved`.  
- Siempre fila en `stock_movements` tipo `ajuste`.

### 5. Reservas de taller (MVP Core 2)

- Dominio **aparte** de `Sale` (`workshop_reservation`).  
- Estados típicos: requested → confirmada → realizada / cancelada.  
- **No** listar pedidos de tienda en el menú Reservas.  
- Stock de piezas en cita: fuera del MVP mínimo.

## Competencias por superficie (Core 2)

| Acción | Cliente | Operador | Dash |
|--------|---------|----------|------|
| Soft-hold al pedir | Sí | No | No |
| Confirm/reject + `salida_venta` + finance | No | Primario | **Paridad sí** |
| Factura entrada / ajuste | No | Según exposición | **Sí** |
| Ver movements / finance | No | Lectura | **Sí** |
| Agenda reservas taller | Solicitar (opcional futuro) | Operar | **Gobernar** |

## 6. Finanzas (Core 2) — aceptado 2026-08-13 · vigente cierre 2026-08-24

| Evento | Stock | Dinero |
|--------|-------|--------|
| Registrar factura de entrada | `existence +=` | Costo en `purchase_entry` (+ líneas); `last_unit_cost` |
| UNVERIFIED | `reserved +=` | **Sin** ingreso |
| VERIFIED | consume existence/reserved | **Ingreso + COGS + margen** (`sale_finance_event`) |
| DELETED | release reserved | **Sin** ingreso |

- COGS: `last_unit_cost × qty` al VERIFIED. **No promedio.**
- Detalle: [`FINANCE_MODEL_CORE2.md`](./FINANCE_MODEL_CORE2.md)

## 7. Permisos Appwrite (cierre B6)

- Confirmado 2026-08-24: permisos por colección alineados a roles (staff write / cliente sin write en movements, purchase, finance, workshop_reservation).
