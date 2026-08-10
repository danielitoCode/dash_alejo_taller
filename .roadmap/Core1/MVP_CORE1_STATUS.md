# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-10  
**Veredicto:** Alineación de **código** Core 1 completa (0 → 6.1). **6.2** runbook publicado; ejecución manual pendiente. QA formal después.

## Fase 6 — Coherencia + smoke

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **6.1** No B2C / no segundo hold / no verify sin stock | **Hecho** | Policy + guards + catalog write |
| **6.2** Smoke tienda → dash | **Runbook listo** · ejecución ☐ | [`SMOKE_6_2.md`](./SMOKE_6_2.md) |

### Cómo cerrar la ejecución 6.2

1. Seguir [`SMOKE_6_2.md`](./SMOKE_6_2.md) en staging.
2. Marcar Camino A + B + negativos.
3. Rellenar “Registro de ejecución” del propio runbook.
4. Luego: [`QA_CORE1_CHECK_plan.md`](./QA_CORE1_CHECK_plan.md).

## Alineación Core 1 (código)

| Área | Estado |
|------|--------|
| Modelo reserved/available | ✓ |
| Catálogo existence ≥ reserved | ✓ |
| Roles staff | ✓ |
| Ventas currency + filtros | ✓ |
| Confirm/reject + stock | ✓ |
| No origen B2C / no segundo hold | ✓ |
| Smoke cruzado documentado | ✓ (ejecución pendiente) |

```bash
npm run test:unit
```

**Siguiente (fuera de código):** ejecutar smoke 6.2 → QA formal.
