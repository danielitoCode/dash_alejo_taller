# Core 6 — Taller y Reservas

## Objetivo

Gestionar el ciclo de vida de las citas y servicios del taller sin confundir una reserva con una venta de producto.

## Alcance

- Clientes del taller.
- Servicios.
- `Appointment`.
- Agenda.
- Técnico asignado.
- Fecha y hora.
- Notas.
- Estados `REQUESTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`.
- Consulta y gestión desde back-office.

## Regla fundamental

```text
Appointment ≠ Sale
```

Una reserva no genera automáticamente una venta B2C.

## Fuera de alcance inicial

- Conversión automática de servicio a venta.
- Gestión avanzada de repuestos.
- Facturación de servicios.

## Definition of Done

- [ ] Modelo de citas definido.
- [ ] CRUD y estados implementados.
- [ ] Agenda funcional.
- [ ] Cliente y servicio asociados.
- [ ] Técnico asignable.
- [ ] Validaciones de fecha/hora.
- [ ] Realtime/offline según corresponda.
- [ ] Tests de transición de estados.

## Dependencias

Core 1 como base de identidad y Core 5 para supervisión futura.

## Siguiente Core

Core 7 — Hardening y plataforma.
