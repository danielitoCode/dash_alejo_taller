# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-10  
**Veredicto:** Alineación código **7.1** cerrada. **7.2** gate pre-QA publicado.  
Ejecución smoke + QA formal pendientes.

| Hito | Estado |
|------|--------|
| Código 0 → 6.4 | ✓ |
| 7.1 Exit alineación | ✓ |
| 7.2 Pre-QA gate (doc) | ✓ · ejecución ☐ |
| Smoke 6.2 | ☐ |
| QA formal | ☐ |
| **Core 1 dash cerrado** | ☐ |

## Documentos clave

| Doc | Uso |
|-----|-----|
| [`PHASE_7_1_ALIGNMENT_EXIT.md`](./PHASE_7_1_ALIGNMENT_EXIT.md) | Cierre implementación |
| [`PHASE_7_2_PRE_QA_GATE.md`](./PHASE_7_2_PRE_QA_GATE.md) | Orden: unit → smoke → QA |
| [`SMOKE_6_2.md`](./SMOKE_6_2.md) | Smoke tienda → dash |
| [`QA_CORE1_CHECK_plan.md`](./QA_CORE1_CHECK_plan.md) | Checklist formal |

```bash
npm run test:unit && npm run check && npm run build
```

**Siguiente:** ejecutar Gate A–C de 7.2; luego QA formal.
