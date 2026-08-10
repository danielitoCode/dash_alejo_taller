# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-10  
**Veredicto:** Serie **7.x** de cierre documental completa (7.1–7.3).  
**Core 1 dash cerrado:** ☐ (requiere DoD en [`PHASE_7_3_CORE1_DOD.md`](./PHASE_7_3_CORE1_DOD.md))

| Hito | Estado |
|------|--------|
| Código 0 → 6.4 | ✓ |
| 7.1 Exit alineación | ✓ |
| 7.2 Pre-QA gate | ✓ (doc) · ejecución ☐ |
| 7.3 DoD + hoja QA | ✓ (doc) · DoD formal ☐ |
| Smoke 6.2 | ☐ |
| QA checklist | ☐ |

## Cómo cerrar de verdad el núcleo

1. Gate A: `npm run test:unit && npm run check && npm run build`
2. [`SMOKE_6_2.md`](./SMOKE_6_2.md)
3. [`QA_CORE1_CHECK_plan.md`](./QA_CORE1_CHECK_plan.md)
4. Rellenar registro en [`PHASE_7_3_CORE1_DOD.md`](./PHASE_7_3_CORE1_DOD.md) §3
5. Marcar aquí: **Core 1 dash cerrado** + fecha

## Documentos 7.x

| Doc | Rol |
|-----|-----|
| [PHASE_7_1_ALIGNMENT_EXIT.md](./PHASE_7_1_ALIGNMENT_EXIT.md) | Código alineado |
| [PHASE_7_2_PRE_QA_GATE.md](./PHASE_7_2_PRE_QA_GATE.md) | Gates A–D |
| [PHASE_7_3_CORE1_DOD.md](./PHASE_7_3_CORE1_DOD.md) | **Definition of Done** |
