# Core 2 — Estado MVP Back-office

**Última actualización:** 2026-08-23  
**Veredicto:** **En curso** — B5 código ✓; siguiente **B6 cierre** (+ smoke reservas).  
**Core 2 dash cerrado:** ☐  
**Rama:** `Core2`  
**Checklist unificado:** [`CORE2_UNIFIED_CHECKLIST.md`](./CORE2_UNIFIED_CHECKLIST.md)

| Fase | Nombre | Estado |
|------|--------|--------|
| 2.0 | Alcance + políticas delta | ✓ |
| 2.1 | Schema Appwrite + dominio | ✓ cloud · ✓ dominio/DTO/mapper · ✓ net repos dash · ✓ operador net |
| 2.2 | Operador `salida_venta` + finance | ✓ código (smoke dispositivo ☐) |
| 2.3 | Panel factura + movements / ajuste | ✓ (B3.1–B3.3) |
| 2.4 | Reportes + cola UNVERIFIED | ✓ (B4.1 + B4.2) |
| 2.5 | Reservas de taller | ✓ código (smoke UI ☐) |
| 2.6 | Seguridad + DoD | ☐ ← siguiente |

## Hecho (2026-08-23)

- [x] B3 inventario formal (entrada, factura, ajuste, listados)
- [x] B4.1 cola UNVERIFIED por antigüedad
- [x] B4.2 resumen finance en Dashboard
- [x] B5 reservas taller (dominio + panel Reservas)

## Pendiente inmediato

1. **Smoke B5:** crear reserva en panel Reservas → doc en Appwrite
2. Smokes: B2 dispositivo; B3.3 ajuste (opcional)
3. **B6** — permisos, CI final, smoke cruzado, merge a master

## Cómo cerrar

Ver DoD en plan + bloques B5–B6 del checklist unificado.
