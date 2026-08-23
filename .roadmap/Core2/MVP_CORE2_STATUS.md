# Core 2 — Estado MVP Back-office

**Última actualización:** 2026-08-23  
**Veredicto:** **En curso** — B3.3 ✓ (ajuste + Inventario); siguiente **B4.1 cola UNVERIFIED**.  
**Core 2 dash cerrado:** ☐  
**Rama:** `Core2`  
**Checklist unificado:** [`CORE2_UNIFIED_CHECKLIST.md`](./CORE2_UNIFIED_CHECKLIST.md)

| Fase | Nombre | Estado |
|------|--------|--------|
| 2.0 | Alcance + políticas delta | ✓ |
| 2.1 | Schema Appwrite + dominio | ✓ cloud · ✓ dominio/DTO/mapper · ✓ net repos dash · ✓ operador net |
| 2.2 | Operador `salida_venta` + finance | ✓ código (smoke dispositivo ☐) |
| 2.3 | Panel factura + movements / ajuste | ✓ (B3.1–B3.3) |
| 2.4 | Reportes + cola UNVERIFIED | ☐ |
| 2.5 | Reservas de taller | ☐ |
| 2.6 | Seguridad + DoD | ☐ |

## Hecho (2026-08-19)

- [x] Collections Appwrite + permisos
- [x] Soft-hold Core 1 intacto en `master`; trabajo en `Core2`
- [x] Dominio/DTO/mapper + **net repositories** dash (inventory/purchase/finance)
- [x] Constantes `APPWRITE_COLLECTIONS`
- [x] Tests unitarios mapper round-trip

## Código baseline (2026-08-23)

- B3.1–B3.3: entrada formal, factura multi-línea, ajuste auditado, vista Inventario
- Siguiente: B4.1 cola UNVERIFIED por antigüedad

## Cómo cerrar

Ver DoD en plan + bloques B4–B6 del checklist unificado.
