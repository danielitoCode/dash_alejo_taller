# Core 1 — Back-office alineado (Auth staff + Catálogo + Ventas + Soft-hold)

**Estado:** **Alineación de código CERRADA (7.1).** Smoke y QA formal pendientes.  
**Criterio de cierre formal del núcleo:** checklist `QA_CORE1_CHECK_plan.md` en verde + smoke 6.2 ejecutado.

**Última actualización:** 2026-08-10

## Fases de implementación

| Bloque | Estado |
|--------|--------|
| 0.x Freeze + secretos + inventario | **Hecho** |
| 1.x–2.x Modelo stock + catálogo | **Hecho** |
| 3.x Auth staff / gates | **Hecho** |
| 4.x Ventas lectura + currency | **Hecho** |
| 5.x Confirm / reject + stock | **Hecho** |
| 6.1–6.4 Coherencia / smoke doc / Dexie / UI | **Hecho** |
| **7.1 Exit alineación** | **Hecho** → [`PHASE_7_1_ALIGNMENT_EXIT.md`](./PHASE_7_1_ALIGNMENT_EXIT.md) |

## Índice

| Archivo | Descripción |
|---------|-------------|
| [CANONICAL_RULES_FREEZE.md](./CANONICAL_RULES_FREEZE.md) | Reglas no negociables |
| [PHASE_7_1_ALIGNMENT_EXIT.md](./PHASE_7_1_ALIGNMENT_EXIT.md) | **Cierre alineación código** |
| [CODE_INVENTORY_0_3.md](./CODE_INVENTORY_0_3.md) | Mapa de archivos |
| [SMOKE_6_2.md](./SMOKE_6_2.md) | Smoke cruzado pre-QA |
| [PHASE_6_3.md](./PHASE_6_3.md) | Espejo Dexie |
| [PHASE_6_4.md](./PHASE_6_4.md) | Reactividad UI |
| [QA_CORE1_CHECK_plan.md](./QA_CORE1_CHECK_plan.md) | QA post-alineación |
| [MVP_CORE1_STATUS.md](./MVP_CORE1_STATUS.md) | Estado |
| [ALIGNMENT_WITH_ALEJOTALLER.md](./ALIGNMENT_WITH_ALEJOTALLER.md) | Paridad ecosistema |

**Políticas:** `.policies/auth`, `sale`, `warehouse`, `product`, `panel`
