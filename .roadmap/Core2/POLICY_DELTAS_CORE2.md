# Core 2 — Deltas de política (respecto a Core 1)

**Fecha:** 2026-08-12  
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
| `entrada` | `+= quantity` | staff (dash / operador admin) |
| `salida_venta` | `-= quantity` | al VERIFIED (operador o dash) |
| `ajuste` | ± según dirección | staff; post-ajuste `existence ≥ reserved` |
| `devolucion` | `+= quantity` | staff; solo post-VERIFIED |

Campos mínimos: `product_id`, `type`, `quantity` (>0), `balance_after`, `reason`, `user_id`, `sale_id?`, `created_at`.

### 2. Devolución formal

- Solo sobre venta **VERIFIED** (o línea ya consumida).  
- `existence += qty` + movimiento `devolucion` + motivo obligatorio.  
- **No** reabrir el soft-hold de esa venta.

### 3. Ajuste de inventario

- Motivo + `user_id` obligatorios.  
- Validación: tras el ajuste, `existence >= reserved`.  
- Preferible escribir siempre fila en `stock_movements`.

### 4. Reservas de taller (si entran en Core 2)

- Dominio **aparte** de `Sale` (p. ej. collection `appointment` / `booking`).  
- Estados típicos: solicitada → confirmada → realizada / cancelada.  
- **No** listar pedidos de tienda en el menú Reservas.  
- Stock de piezas en cita: **fuera** del MVP mínimo (Core posterior).

## Competencias por superficie (Core 2)

| Acción | Cliente | Operador | Dash |
|--------|---------|----------|------|
| Soft-hold al pedir | Sí | No | No |
| Confirm/reject + `salida_venta` | No | Primario | Secundario |
| Entrada / ajuste / devolución | No | Sí (si se expone) | **Sí** |
| Ver movimientos | No | Lectura | **Sí** |
| Agenda reservas taller | Solicitar (futuro) | Operar | **Gobernar** |
