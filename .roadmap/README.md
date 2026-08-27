# Roadmap dash_alejo_taller (Back-office)

| Directorio | Alcance | Estado |
|------------|---------|--------|
| [`Core1/`](./Core1/) | Soft-hold, catálogo, ventas, roles, QA | **Cerrado** (2026-08-12) |
| [`Core2/`](./Core2/) | Factura entrada, movements (`entrada`/`salida_venta`), finance, cola, reservas taller | **Cerrado** (2026-08-24) · PR #12 → `master` |

## Core 1

- DoD: [`Core1/PHASE_7_3_CORE1_DOD.md`](./Core1/PHASE_7_3_CORE1_DOD.md) = **SÍ**
- Estado: [`Core1/MVP_CORE1_STATUS.md`](./Core1/MVP_CORE1_STATUS.md)

## Core 2

- Checklist: [`Core2/CORE2_UNIFIED_CHECKLIST.md`](./Core2/CORE2_UNIFIED_CHECKLIST.md) — **cerrado**
- Estado: [`Core2/MVP_CORE2_STATUS.md`](./Core2/MVP_CORE2_STATUS.md) — **Core 2 cerrado: SÍ**
- Políticas: [`Core2/POLICY_DELTAS_CORE2.md`](./Core2/POLICY_DELTAS_CORE2.md)
- Finanzas: [`Core2/FINANCE_MODEL_CORE2.md`](./Core2/FINANCE_MODEL_CORE2.md)

### Entregado en Core 2

- Factura de entrada multi-línea + `stock_movements` tipo `entrada` + `last_unit_cost`
- `salida_venta` + `sale_finance_event` al VERIFIED (paridad panel / operador)
- Cola UNVERIFIED + KPIs finance + badges nav
- Listados de movimientos y facturas
- Reservas taller (`workshop_reservation`) gobernadas en dash
- Permisos Appwrite staff/cliente por colección

### Fuera de Core 2 (futuro)

- **Ajuste de inventario (UI)** — no disponible; política documentada
- Devolución formal (UI)
- Reserva taller desde cliente web
- Smoke dispositivo operador

**Políticas:** [`.policies/`](../.policies/) · soft-hold canónico en AlejoTaller `.policies/warehouse` y `.policies/sale`
