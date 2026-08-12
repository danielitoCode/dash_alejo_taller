# Core 2 — Estado MVP Back-office

**Última actualización:** 2026-08-13  
**Veredicto:** **Planificado** — finanzas aceptadas (COGS = último costo); reservas de taller en MVP. Siguiente: schema **2.1**.  
**Core 2 dash cerrado:** ☐

| Fase | Nombre | Estado |
|------|--------|--------|
| 2.0 | Alcance + políticas delta | ✓ Doc · **decisiones producto SÍ** · espejo AlejoTaller ☐ |
| 2.1 | Schema stock + finanzas (supplier, purchase_entry, …) | ☐ |
| 2.2 | Operador `salida_venta` + ingreso/COGS | ☐ (AlejoTaller) |
| 2.3 | Panel **factura de entrada** + movimientos / ajuste | ☐ |
| 2.4 | Reportes económicos + cola UNVERIFIED | ☐ |
| 2.5 | Reservas de taller | ☐ **incluida en MVP** |
| 2.6 | Seguridad + DoD | ☐ |

## Dependencias

- Core 1 dash: **cerrado** (2026-08-12)
- Soft-hold: **congelado** — no cambiar fórmula ni efectos UNVERIFIED/VERIFIED/DELETED
- Schema canónico movimientos: `AlejoTaller/.roadmap/Core2/DESIGN_STOCK_MOVEMENTS.md`
- Modelo financiero: [`FINANCE_MODEL_CORE2.md`](./FINANCE_MODEL_CORE2.md) — **aceptado**

## Decisiones de producto (2026-08-13)

- [x] Modelo financiero **aceptado** (factura de entrada + margen al VERIFIED)
- [x] COGS = **último costo** (`last_unit_cost` × qty) — no promedio
- [x] **Reservas de taller** incluidas en el MVP Core 2
- [ ] Go/no-go monorepo `AlejoTaller/admin` (no bloquea 2.1–2.5)
- [ ] Espejo de alcance/políticas en `AlejoTaller/.roadmap/Core2/`

## Cómo cerrar Core 2

Ver criterios en [`CORE2_IMPLEMENTATION_PLAN.md`](./CORE2_IMPLEMENTATION_PLAN.md) § DoD.
