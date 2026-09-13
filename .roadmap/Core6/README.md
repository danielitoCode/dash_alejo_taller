# Core 6 — Taller y Reservas · **dash_alejo_taller**

**Rama:** `Core6` · **Apertura:** 2026-09-13  
**Regla:** `Appointment ≠ Sale` — una reserva **no** genera venta B2C automática.

## Objetivo

Ciclo de vida de **citas y servicios de taller** en el back-office: clientes de taller, servicios, agenda, técnico, estados.

## Alcance (producto en este repo)

| Pieza | Descripción |
|-------|-------------|
| Cliente taller | Ficha / vínculo a usuario o contacto |
| Servicio | Catálogo de servicios (no es `Product` de venta) |
| `Appointment` | Cita con fecha/hora, notas, estados |
| Agenda | Vista listado + día/semana operativa |
| Técnico | Asignación de staff |
| Estados | `REQUESTED` → `CONFIRMED` → `COMPLETED` / `CANCELLED` |

## Fuera de alcance (Core 6)

- Conversión automática servicio → `Sale`
- Gestión avanzada de repuestos
- Facturación formal de servicios

## Checklists

- [DASH_IMPLEMENTATION_CHECKLIST.md](./DASH_IMPLEMENTATION_CHECKLIST.md) — trabajo en este repo
- [CORE6_UNIFIED_CHECKLIST.md](./CORE6_UNIFIED_CHECKLIST.md) — índice dash + AT
- [MVP_CORE6_STATUS.md](./MVP_CORE6_STATUS.md) — estado vivo

## Dependencias

Core 1 (identidad/roles) · Core 5 (supervisión futura de ops, no bloqueante).

## Siguiente

Core 7 — Hardening y plataforma.
