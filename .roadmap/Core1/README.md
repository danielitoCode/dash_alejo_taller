# Core 1 — Back-office alineado (Auth staff + Catálogo + Ventas + Soft-hold)

**Estado:** Fase 0 completa; listo para implementar paridad de modelo/stock.  
**Criterio de cierre:** checklist `QA_CORE1_CHECK_plan.md` en verde + soft-hold respetado.

**Última actualización:** 2026-08-09

## Fase 0

| Tarea | Estado |
|-------|--------|
| [0.1 Congelar reglas](./CANONICAL_RULES_FREEZE.md) | **Hecho** |
| 0.2 Higiene secretos | **Hecho** |
| [0.3 Inventario de código](./CODE_INVENTORY_0_3.md) | **Hecho** |

## Siguiente

Implementar **Fase 1** según el inventario: `Product` + DTO + mapper + Dexie (`reserved` / `available`).

## Índice

| Archivo | Descripción |
|---------|-------------|
| [CANONICAL_RULES_FREEZE.md](./CANONICAL_RULES_FREEZE.md) | Reglas no negociables |
| [CODE_INVENTORY_0_3.md](./CODE_INVENTORY_0_3.md) | Archivos a tocar por fase |
| [QA_CORE1_CHECK_plan.md](./QA_CORE1_CHECK_plan.md) | QA post-alineación |
| [MVP_CORE1_STATUS.md](./MVP_CORE1_STATUS.md) | Estado |
| [ALIGNMENT_WITH_ALEJOTALLER.md](./ALIGNMENT_WITH_ALEJOTALLER.md) | Paridad ecosistema |

**Políticas:** `.policies/auth`, `sale`, `warehouse`, `product`, `panel`
