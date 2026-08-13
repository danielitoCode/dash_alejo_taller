# Core 4 — Finanzas de Ventas

## Objetivo

Determinar de forma consistente los ingresos, costo de mercancía vendida (COGS) y margen generado por las ventas confirmadas.

## Alcance

- `sale_finance_event`.
- Revenue de ventas `VERIFIED`.
- COGS usando el costo aplicable al momento de la venta.
- Snapshot del costo utilizado para preservar históricos.
- Margen por venta y línea.
- Idempotencia de eventos financieros.
- Exclusión de pedidos `UNVERIFIED` y `DELETED` del ingreso realizado.

## Regla base

```text
COGS = unit_cost_snapshot × quantity
margin = revenue - COGS
```

## Fuera de alcance

- Contabilidad general.
- Reportes/KPIs avanzados.
- Reservas de taller.

## Definition of Done

- [ ] Evento financiero generado al confirmar una venta.
- [ ] `UNVERIFIED` no genera ingreso realizado.
- [ ] COGS correcto y reproducible.
- [ ] Costo utilizado almacenado como snapshot.
- [ ] Margen correcto.
- [ ] Eventos idempotentes.
- [ ] Tests unitarios e integración.

## Dependencias

Core 2 — Inventario Trazable y Core 3 — Compras y Abastecimiento.

## Siguiente Core

Core 5 — Supervisión y reportes.
