# Core 2 — Estado MVP Back-office

**Última actualización:** 2026-08-18  
**Veredicto:** **En curso** — schema Appwrite **creado + permisos**; siguiente **B1 net repos** y luego B2/B3 en paralelo.  
**Core 2 dash cerrado:** ☐  
**Rama:** `Core2`  
**Checklist unificado:** [`CORE2_UNIFIED_CHECKLIST.md`](./CORE2_UNIFIED_CHECKLIST.md)

| Fase | Nombre | Estado |
|------|--------|--------|
| 2.0 | Alcance + políticas delta | ✓ |
| 2.1 | Schema Appwrite + dominio | ✓ cloud · ◐ código dominio/DTO (dash) · net repos ☐ |
| 2.2 | Operador `salida_venta` + finance | ☐ (AlejoTaller) |
| 2.3 | Panel factura + movements / ajuste | ☐ (entrada rápida existence-only hoy) |
| 2.4 | Reportes + cola UNVERIFIED | ☐ |
| 2.5 | Reservas de taller | ☐ |
| 2.6 | Seguridad + DoD | ☐ |

## Hecho (2026-08-18)

- [x] Collections en Appwrite: `stock_movements`, `supplier`, `purchase_entry`, `purchase_entry_line`, `sale_finance_event`, `last_unit_cost`
- [x] Permisos staff/operador; cliente sin write
- [x] Soft-hold Core 1 intacto en `master`; trabajo en `Core2`
- [x] Checklist unificado cliente + dash + operador

## Código baseline (no Core 2 formal completo)

- «Dar entrada»: `existence += qty` (sin movement formal hasta B3)
- Dominio/DTO/mapper en rama Core2 (si ya presente) → completar **net repositories**

## Cómo cerrar

Ver DoD en [`CORE2_IMPLEMENTATION_PLAN.md`](./CORE2_IMPLEMENTATION_PLAN.md) y bloques B1–B6 del checklist unificado.
