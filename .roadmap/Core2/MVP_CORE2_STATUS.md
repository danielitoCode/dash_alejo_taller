# Core 2 — Estado MVP Back-office

**Última actualización:** 2026-08-19  
**Veredicto:** **En curso** — B1 dash **net repos + tests mapper** listos; siguiente **B2 operador** ∥ **B3 entrada formal**.  
**Core 2 dash cerrado:** ☐  
**Rama:** `Core2`  
**Checklist unificado:** [`CORE2_UNIFIED_CHECKLIST.md`](./CORE2_UNIFIED_CHECKLIST.md)

| Fase | Nombre | Estado |
|------|--------|--------|
| 2.0 | Alcance + políticas delta | ✓ |
| 2.1 | Schema Appwrite + dominio | ✓ cloud · ✓ dominio/DTO/mapper · ✓ net repos dash · operador net ☐ |
| 2.2 | Operador `salida_venta` + finance | ☐ (AlejoTaller) |
| 2.3 | Panel factura + movements / ajuste | ☐ (entrada rápida existence-only hoy) |
| 2.4 | Reportes + cola UNVERIFIED | ☐ |
| 2.5 | Reservas de taller | ☐ |
| 2.6 | Seguridad + DoD | ☐ |

## Hecho (2026-08-19)

- [x] Collections Appwrite + permisos
- [x] Soft-hold Core 1 intacto en `master`; trabajo en `Core2`
- [x] Dominio/DTO/mapper + **net repositories** dash (inventory/purchase/finance)
- [x] Constantes `APPWRITE_COLLECTIONS`
- [x] Tests unitarios mapper round-trip

## Código baseline

- «Dar entrada»: `existence += qty` (movement formal = B3)

## Cómo cerrar

Ver DoD en plan + bloques B2–B6 del checklist unificado.
