# Core 2 — Estado MVP Back-office

**Última actualización:** 2026-08-12  
**Veredicto:** **Planificado** — documentación de fases lista; implementación pendiente.  
**Core 2 dash cerrado:** ☐

| Fase | Nombre | Estado |
|------|--------|--------|
| 2.0 | Alcance + políticas delta | ✓ Doc · ejecución ☐ |
| 2.1 | Schema `stock_movements` | ☐ |
| 2.2 | Operador `salida_venta` | ☐ (AlejoTaller) |
| 2.3 | Panel movimientos / entrada / ajuste | ☐ |
| 2.4 | Reportes + cola UNVERIFIED | ☐ |
| 2.5 | Reservas de taller | ☐ opcional en MVP |
| 2.6 | Seguridad + DoD | ☐ |

## Dependencias

- Core 1 dash: **cerrado** (2026-08-12)
- Soft-hold: **congelado** — no cambiar fórmula ni efectos UNVERIFIED/VERIFIED/DELETED
- Schema canónico movimientos: `AlejoTaller/.roadmap/Core2/DESIGN_STOCK_MOVEMENTS.md`

## Pendiente de decisión de producto

- [ ] Incluir **Reservas de taller** dentro del MVP Core 2 o diferir a Core 2.5 / Core 3
- [ ] Go/no-go monorepo `AlejoTaller/admin` (no bloquea 2.1–2.4)

## Cómo cerrar Core 2

Ver criterios en [`CORE2_IMPLEMENTATION_PLAN.md`](./CORE2_IMPLEMENTATION_PLAN.md) § DoD.
