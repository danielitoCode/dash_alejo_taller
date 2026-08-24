# Core 2 — Inventario formal, supervisión y endurecimiento (Back-office)

**Estado:** **cerrado** (código + smokes + CI + permisos Appwrite) — 2026-08-24  
**Merge a `master`:** pendiente de PR desde `Core2`  
**Depende de:** Core 1 dash cerrado  
**Paridad ecosistema:** [`AlejoTaller/.roadmap/Core2/`](https://github.com/danielitoCode/AlejoTaller/tree/master/.roadmap/Core2)

> Core 2 **no reescribe** el soft-hold de Core 1. Añade **finanzas** (factura de entrada, ingreso/margen al confirmar, COGS = último costo), traza (`stock_movements`), reportes, **reservas de taller**, seguridad y paridad confirm panel/operador.

## Índice

| Documento | Rol |
|-----------|-----|
| [CORE2_UNIFIED_CHECKLIST.md](./CORE2_UNIFIED_CHECKLIST.md) | Checklist unificado B0–B6 |
| [CORE2_IMPLEMENTATION_PLAN.md](./CORE2_IMPLEMENTATION_PLAN.md) | Plan por fases |
| [MVP_CORE2_STATUS.md](./MVP_CORE2_STATUS.md) | Estado vivo |
| [POLICY_DELTAS_CORE2.md](./POLICY_DELTAS_CORE2.md) | Políticas delta vs Core 1 |
| [FINANCE_MODEL_CORE2.md](./FINANCE_MODEL_CORE2.md) | Factura, costos, ingreso/margen |

## Fases (resumen)

| Fase | Nombre | Estado |
|------|--------|--------|
| **2.0** | Alcance y políticas | ✓ |
| **2.1** | Schema stock + finanzas | ✓ |
| **2.2** | Confirm: salida_venta + finance | ✓ |
| **2.3** | Factura de entrada + movements | ✓ |
| **2.4** | Reportes + cola UNVERIFIED | ✓ |
| **2.5** | Reservas de taller | ✓ |
| **2.6** | CI, permisos, DoD | ✓ (merge master pendiente) |

## Cómo cerrar en git

1. PR `Core2` → `master` (este repo + AlejoTaller).  
2. Tras merge, marcar merge completado en STATUS si aplica.

Core 1: [../Core1/](../Core1/)
