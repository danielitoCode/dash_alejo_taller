# Roadmap dash_alejo_taller (Back-office)

| Directorio | Alcance | Estado |
|------------|---------|--------|
| [`Core1/`](./Core1/) | Soft-hold, catálogo, ventas, roles, QA | **Cerrado** (2026-08-12) |
| [`Core2/`](./Core2/) | Factura entrada, movements (`entrada`/`salida_venta`), finance, cola, reservas taller | **Cerrado** (2026-08-24) · PR #12 → `master` |
| [`Core3/`](./Core3/) | Compras y abastecimiento (proveedores, historial, anulación B3.1) | **Listo para merge** · rama `Core3` → PR a `master` |
| [`Core4/`](./Core4/) | Finanzas de ventas (snapshot COGS, margen por línea, idempotencia) | **Abierto** · rama `Core4` |

## Core 1

- DoD: [`Core1/PHASE_7_3_CORE1_DOD.md`](./Core1/PHASE_7_3_CORE1_DOD.md) = **SÍ**
- Estado: [`Core1/MVP_CORE1_STATUS.md`](./Core1/MVP_CORE1_STATUS.md)

## Core 2

- Checklist: [`Core2/CORE2_UNIFIED_CHECKLIST.md`](./Core2/CORE2_UNIFIED_CHECKLIST.md) — **cerrado**
- Estado: [`Core2/MVP_CORE2_STATUS.md`](./Core2/MVP_CORE2_STATUS.md)

## Core 3

- README: [`Core3/README.md`](./Core3/README.md)
- Checklist: [`Core3/CORE3_UNIFIED_CHECKLIST.md`](./Core3/CORE3_UNIFIED_CHECKLIST.md)
- Estado: [`Core3/MVP_CORE3_STATUS.md`](./Core3/MVP_CORE3_STATUS.md)
- **Release mínimo:** B1 + B2 + B3.1 + B4 — código y política listos; merge vía PR `Core3` → `master`
- **Fuera de scope (post-merge):** B3.2 corrección parcial

## Core 4

- README: [`Core4/README.md`](./Core4/README.md)
- Checklist: [`Core4/CORE4_UNIFIED_CHECKLIST.md`](./Core4/CORE4_UNIFIED_CHECKLIST.md)
- Estado: [`Core4/MVP_CORE4_STATUS.md`](./Core4/MVP_CORE4_STATUS.md)
- Política: [`Core4/POLICY_SALE_FINANCE_CORE4.md`](./Core4/POLICY_SALE_FINANCE_CORE4.md)
- **Trabajo en rama `Core4`**; merge a `master` solo con CI verde y release mínimo B0–B6

**Políticas:** [`.policies/`](../.policies/) · soft-hold canónico en AlejoTaller `.policies/warehouse` y `.policies/sale`
