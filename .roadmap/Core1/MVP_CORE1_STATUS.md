# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto desarrollo:** **parcial** — app usable pero **desalineada** respecto al soft-hold / reserved / currency de AlejoTaller Core 1.

## Fase 0 — Baseline alineación

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **0.1** Congelar reglas canónicas | **Hecho** | [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md) |
| **0.2** Higiene secretos | **Hecho** | `.env` fuera del tip; `.gitignore` endurecido |
| **0.3** Inventario de archivos a tocar | **Hecho** | [`CODE_INVENTORY_0_3.md`](./CODE_INVENTORY_0_3.md) |

## Resumen de alcance (código)

| Área | Estado | Nota del inventario 0.3 |
|------|--------|-------------------------|
| Product `reserved` | Ausente | Empezar Fase 1 |
| Verify sale + stock | Solo `buy_state` | Fase 5 — gap crítico |
| Currency en Sale | Ausente en dominio | Fase 4 |
| Roles / gates | Config existe | Fase 3 — validar NestedNavigation |
| Secretos tip | Hecho | 0.2 |

## Micro-tareas (post Fase 0)

### Product / warehouse — Fase 1–2
- [ ] Entidad + DTO + mapper + Dexie con `reserved`
- [ ] UI available / reserved read-only
- [ ] `existence >= reserved` al guardar

### Auth — Fase 3
- [ ] Gates por `ROLE_ROUTE_ACCESS`
- [ ] UserManagement + `canManageRole`

### Sale — Fase 4–5
- [ ] Currency en modelo/UI
- [ ] Filtros por estado
- [ ] Confirm/reject con consume/release + idempotencia

### QA
- [ ] Tras código alineado: `QA_CORE1_CHECK_plan.md`

**Siguiente implementación:** Fase **1.1** (`Product.reserved`).
