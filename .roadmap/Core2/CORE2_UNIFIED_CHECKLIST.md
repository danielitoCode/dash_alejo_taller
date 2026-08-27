# Core 2 — Checklist unificado

**Última actualización:** 2026-08-27  
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
- [x] B3 Factura de entrada + listados Inventario (movimientos / facturas)
- [x] B4 Cola + KPIs + paridad confirm panel
- [x] B5 Reservas taller (dash)
- [x] B6 CI + permisos + smoke cruzado + **merge master**

### Explicitamente fuera del cierre (futuro)

- [ ] **Ajuste de inventario (UI)** — política y tipo `ajuste` en schema; UI no implementada
- [ ] Devolución formal (UI)
- [ ] Smoke dispositivo físico operador (opcional)
- [ ] Reserva taller desde cliente web (E2E B2C)

| Fecha | Ítem |
|-------|------|
| 2026-08-24 | Merge PR #12 · Core 2 cerrado |
| 2026-08-27 | Higiene: ajuste inventario marcado como futura implementación |
