# Roadmap dash_alejo_taller (Back-office)

| Directorio | Alcance | Estado |
|------------|---------|--------|
| [`Core1/`](./Core1/) | Soft-hold, catálogo, ventas, roles, QA | **Cerrado** (2026-08-12) |
| [`Core2/`](./Core2/) | Factura entrada, movements, finance base, cola, reservas | **Cerrado** (2026-08-24) |
| [`Core3/`](./Core3/) | Compras y abastecimiento | **Cerrado / listo merge** · rama `Core3` |
| [`Core4/`](./Core4/) | Finanzas de ventas (snapshot COGS, margen por línea, idempotencia) | **Cerrado** (2026-09-02) · PR [#21](https://github.com/danielitoCode/dash_alejo_taller/pull/21) |

## Core 4 (cerrado)

- README: [`Core4/README.md`](./Core4/README.md)
- Checklist: [`Core4/CORE4_UNIFIED_CHECKLIST.md`](./Core4/CORE4_UNIFIED_CHECKLIST.md)
- Estado: [`Core4/MVP_CORE4_STATUS.md`](./Core4/MVP_CORE4_STATUS.md)
- Política: [`Core4/POLICY_SALE_FINANCE_CORE4.md`](./Core4/POLICY_SALE_FINANCE_CORE4.md)
- Paridad: [`Core4/PARITY_PANEL_OPERATOR.md`](./Core4/PARITY_PANEL_OPERATOR.md)
- **Merge:** PR #21 → `master` con CI verde (espejo AT [#28](https://github.com/danielitoCode/AlejoTaller/pull/28))

## Siguiente

**Core 5** — Supervisión y reportes (consume `sale_finance_event`; no recalcula costos a ojo).

**Políticas:** [`.policies/`](../.policies/)
