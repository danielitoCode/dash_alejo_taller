# Core 2 — Inventario formal, supervisión y endurecimiento (Back-office)

**Estado:** planificado — implementación **no iniciada** (2026-08-12).  
**Depende de:** Core 1 dash **cerrado** ([`../Core1/MVP_CORE1_STATUS.md`](../Core1/MVP_CORE1_STATUS.md)).  
**Paridad ecosistema:** [`AlejoTaller/.roadmap/Core2/`](https://github.com/danielitoCode/AlejoTaller/tree/master/.roadmap/Core2)

> Core 2 **no reescribe** el soft-hold de Core 1. Añade traza (`stock_movements`), ajustes auditados, reportes, seguridad y (opcional en el mismo núcleo) agenda de **Reservas** de taller.

## Índice

| Documento | Rol |
|-----------|-----|
| [CORE2_IMPLEMENTATION_PLAN.md](./CORE2_IMPLEMENTATION_PLAN.md) | **Plan por fases (checklist)** — marcar al completar |
| [MVP_CORE2_STATUS.md](./MVP_CORE2_STATUS.md) | Estado vivo del núcleo |
| [MVP_CORE2_BACKLOG.md](./MVP_CORE2_BACKLOG.md) | Backlog detallado / micro-tareas |
| [POLICY_DELTAS_CORE2.md](./POLICY_DELTAS_CORE2.md) | Qué se congela y qué se añade en políticas |

## Fases (resumen)

| Fase | Nombre | Repo principal |
|------|--------|----------------|
| **2.0** | Alcance y políticas delta | dash + AlejoTaller |
| **2.1** | Schema `stock_movements` | AlejoTaller (Appwrite) → dash consume |
| **2.2** | Operador: `salida_venta` al VERIFIED | AlejoTaller |
| **2.3** | Panel: UI movimientos + entrada/ajuste | **dash** |
| **2.4** | Reportes + cola UNVERIFIED | **dash** |
| **2.5** | Reservas de taller (opcional MVP) | ambos |
| **2.6** | Seguridad, CI, DoD Core 2 | ambos |

## Cómo usar

1. Trabajar en orden **2.0 → 2.6** salvo acuerdo explícito de paralelizar 2.2/2.3.  
2. Marcar casillas en [`CORE2_IMPLEMENTATION_PLAN.md`](./CORE2_IMPLEMENTATION_PLAN.md).  
3. Actualizar [`MVP_CORE2_STATUS.md`](./MVP_CORE2_STATUS.md) al cerrar cada fase.  
4. Soft-hold Core 1 debe seguir en verde (QA 15 min) tras cada entrega de stock.

Core 1: [../Core1/](../Core1/)
