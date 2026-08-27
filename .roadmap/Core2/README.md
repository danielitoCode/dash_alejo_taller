# Core 2 — Inventario formal, finanzas y reservas

**Estado:** **cerrado** (2026-08-24)  
**Merge:** PR [#12](https://github.com/danielitoCode/dash_alejo_taller/pull/12) → `master`

## Qué incrementa este núcleo (vs Core 1)

| Capacidad | Detalle |
|-----------|---------|
| Factura de entrada | Multi-línea; única vía de alta de stock en panel; producto nuevo en factura |
| `stock_movements` | `entrada` (factura), `salida_venta` (confirm VERIFIED) |
| Finanzas / COGS | `last_unit_cost`, `sale_finance_event`; KPIs solo VERIFIED |
| Cola + badges | UNVERIFIED visible; badges ventas / reservas / mensajes |
| Inventario (lectura) | Listado de movimientos y de facturas de entrada |
| Reservas taller | `workshop_reservation` + UI dash (aparte de Sale) |
| Permisos | Cliente sin write en movements / purchase / finance / reservation |

## No incluido (implementación futura)

| Ítem | Notas |
|------|-------|
| **Ajuste de inventario (UI)** | Enum/`ajuste` y política definidos; **UI no disponible** |
| Devolución formal (UI) | Política documentada |
| Reserva taller desde cliente web | Solo gobierno en dash en Core 2 |
| Smoke dispositivo operador | Opcional post-cierre |

## Documentos

| Documento | Rol |
|-----------|-----|
| [CORE2_UNIFIED_CHECKLIST.md](./CORE2_UNIFIED_CHECKLIST.md) | Checklist cerrado |
| [MVP_CORE2_STATUS.md](./MVP_CORE2_STATUS.md) | Estado |
| [POLICY_DELTAS_CORE2.md](./POLICY_DELTAS_CORE2.md) | Políticas |
| [FINANCE_MODEL_CORE2.md](./FINANCE_MODEL_CORE2.md) | Finanzas |

Core 1: [../Core1/](../Core1/)
