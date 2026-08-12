# Core 2 — Inventario formal, supervisión y endurecimiento (Back-office)

**Estado:** planificado — decisiones 2.0 de producto **cerradas** (2026-08-13); implementación no iniciada.  
**Depende de:** Core 1 dash **cerrado** ([`../Core1/MVP_CORE1_STATUS.md`](../Core1/MVP_CORE1_STATUS.md)).  
**Paridad ecosistema:** [`AlejoTaller/.roadmap/Core2/`](https://github.com/danielitoCode/AlejoTaller/tree/master/.roadmap/Core2)

> Core 2 **no reescribe** el soft-hold de Core 1. Añade **finanzas** (factura de entrada con costos/proveedor, ingreso y margen al confirmar venta; COGS = último costo), traza (`stock_movements`), reportes económicos, **reservas de taller**, seguridad.

## Índice

| Documento | Rol |
|-----------|-----|
| [CORE2_IMPLEMENTATION_PLAN.md](./CORE2_IMPLEMENTATION_PLAN.md) | **Plan por fases (checklist)** — marcar al completar |
| [MVP_CORE2_STATUS.md](./MVP_CORE2_STATUS.md) | Estado vivo del núcleo |
| [MVP_CORE2_BACKLOG.md](./MVP_CORE2_BACKLOG.md) | Backlog detallado / micro-tareas |
| [POLICY_DELTAS_CORE2.md](./POLICY_DELTAS_CORE2.md) | Qué se congela y qué se añade en políticas |
| [FINANCE_MODEL_CORE2.md](./FINANCE_MODEL_CORE2.md) | **Factura de entrada, costos, ingreso/margen** |

## Fases (resumen)

| Fase | Nombre | Repo principal |
|------|--------|----------------|
| **2.0** | Alcance y políticas delta | dash + AlejoTaller |
| **2.1** | Schema stock + finanzas | AlejoTaller (Appwrite) → dash consume |
| **2.2** | Confirm: `salida_venta` + ingreso/COGS | AlejoTaller (+ dash) |
| **2.3** | Panel: **factura de entrada** + movimientos | **dash** |
| **2.4** | Reportes económicos + cola UNVERIFIED | **dash** |
| **2.5** | Reservas de taller (**en MVP**) | ambos |
| **2.6** | Seguridad, CI, DoD Core 2 | ambos |

## Cómo usar

1. Trabajar en orden **2.0 → 2.6** salvo acuerdo explícito de paralelizar 2.2/2.3.  
2. Marcar casillas en [`CORE2_IMPLEMENTATION_PLAN.md`](./CORE2_IMPLEMENTATION_PLAN.md).  
3. Actualizar [`MVP_CORE2_STATUS.md`](./MVP_CORE2_STATUS.md) al cerrar cada fase.  
4. Soft-hold Core 1 debe seguir en verde (QA 15 min) tras cada entrega de stock.

Core 1: [../Core1/](../Core1/)
