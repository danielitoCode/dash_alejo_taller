# Core 2 — Checklist unificado

**Última actualización:** 2026-08-24  
**Core 2 cerrado:** **SÍ**  
**Merge dash → master:** PR [#12](https://github.com/danielitoCode/dash_alejo_taller/pull/12) (2026-08-24)

### Fórmulas

- `available = max(0, existence − reserved)`
- COGS = `last_unit_cost × qty` al VERIFIED
- Cliente no escribe movements / purchase / finance / workshop_reservation
- Alta stock panel solo vía factura de entrada

## B0–B6

- [x] B0 Baseline
- [x] B1 Dominio/DTO/net
- [x] B2 Operador salida_venta + finance
- [x] B3 Factura + ajuste + Inventario
- [x] B4 Cola + KPIs + paridad confirm panel
- [x] B5 Reservas taller
- [x] B6 CI + permisos + smoke cruzado + **merge master**

Opcional: smoke dispositivo operador; reserva desde cliente web.

| Fecha | Ítem |
|-------|------|
| 2026-08-24 | Merge PR #12 · Core 2 cerrado |
