# Roadmap dash_alejo_taller (Back-office)

Panel de administración y gobierno de negocio de **AlejoTaller**.

Este roadmap sigue el mismo estilo de entrega por núcleos que el monorepo
[`AlejoTaller`](https://github.com/danielitoCode/AlejoTaller), acotado al **panel back-office**
(no tienda B2C, no operador de piso móvil).

| Directorio | Alcance | Estado |
|------------|---------|--------|
| [`Core1/`](./Core1/) | Soft-hold, catálogo, ventas UNVERIFIED→VERIFIED/DELETED, roles, QA | **Cerrado** (2026-08-12) |
| [`Core2/`](./Core2/) | `stock_movements`, entrada/ajuste/devolución, reportes, seguridad, reservas (opc.) | **Planificado** |

## Core 1

- DoD: [`Core1/PHASE_7_3_CORE1_DOD.md`](./Core1/PHASE_7_3_CORE1_DOD.md) = **SÍ**
- Estado: [`Core1/MVP_CORE1_STATUS.md`](./Core1/MVP_CORE1_STATUS.md)
- QA: [`Core1/QA_CORE1_CHECK_plan.md`](./Core1/QA_CORE1_CHECK_plan.md)

## Core 2

- **Plan por fases (checklist):** [`Core2/CORE2_IMPLEMENTATION_PLAN.md`](./Core2/CORE2_IMPLEMENTATION_PLAN.md)
- Estado: [`Core2/MVP_CORE2_STATUS.md`](./Core2/MVP_CORE2_STATUS.md)
- Políticas delta: [`Core2/POLICY_DELTAS_CORE2.md`](./Core2/POLICY_DELTAS_CORE2.md)
- Backlog: [`Core2/MVP_CORE2_BACKLOG.md`](./Core2/MVP_CORE2_BACKLOG.md)

**Cómo usar**

- Marca checkboxes `[x]` cuando verifiques en código o QA.
- Core 2 no reabre el soft-hold de Core 1; toda entrega de stock debe pasar regresión del QA de 15 min.

**Políticas de producto (este repo):** [`.policies/`](../.policies/)  
**Fuente canónica soft-hold:** `AlejoTaller/.policies/warehouse` y `AlejoTaller/.policies/sale`
