# Core 2 — Estado MVP Back-office

**Última actualización:** 2026-08-13  
**Veredicto:** **En curso** — 2.1 dominio/mappers + schema doc listos; crear collections en Appwrite + net repos pendiente.  
**Core 2 dash cerrado:** ☐  
**Rama:** `Core2`

| Fase | Nombre | Estado |
|------|--------|--------|
| 2.0 | Alcance + políticas delta | ✓ Doc · **decisiones producto SÍ** · espejo AlejoTaller ☐ |
| 2.1 | Schema stock + finanzas | ◐ **código dominio/DTO/mapper** · Appwrite console ☐ · net repos ☐ |
| 2.2 | Operador `salida_venta` + ingreso/COGS | ☐ (AlejoTaller) |
| 2.3 | Panel **factura de entrada** + movimientos / ajuste | ☐ |
| 2.4 | Reportes económicos + cola UNVERIFIED | ☐ |
| 2.5 | Reservas de taller | ☐ **incluida en MVP** |
| 2.6 | Seguridad + DoD | ☐ |

## Dependencias

- Core 1 dash: **cerrado** (2026-08-12)
- Soft-hold: **congelado**
- Schema Appwrite: [`APPWRITE_CORE2_SCHEMA.md`](./APPWRITE_CORE2_SCHEMA.md)
- Modelo financiero: [`FINANCE_MODEL_CORE2.md`](./FINANCE_MODEL_CORE2.md) — **aceptado** · COGS = último costo

## Decisiones de producto (2026-08-13)

- [x] Modelo financiero **aceptado**
- [x] COGS = **último costo** (`last_unit_cost` × qty)
- [x] **Reservas de taller** en MVP Core 2

## 2.1 entregado en código (rama Core2)

- `Product.lastUnitCost` / `last_unit_cost`
- Features: `inventory`, `purchase`, `finance` (domain + DTO + mapper + repo interfaces)
- `APPWRITE_COLLECTIONS` constants
- Tests unitarios COGS + mapper

## Pendiente 2.1

- [ ] Crear attributes/collections en consola Appwrite (checklist en schema doc)
- [ ] Net repositories Appwrite
