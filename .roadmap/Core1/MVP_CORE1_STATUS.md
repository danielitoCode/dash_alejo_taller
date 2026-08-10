# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-10  
**Veredicto:** **5.1 + 5.2** confirm/reject con stock = operador.

## Fase 5 — Escritura stock

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **5.1** Confirm VERIFIED + stock | **Hecho** | `ConfirmSaleFromPanelCaseUse` |
| **5.2** Reject DELETED + release reserved | **Hecho** | `RejectSaleFromPanelCaseUse` + UI |
| **5.3** Idempotencia / hardening | Parcial (ambos flujos idempotentes) |

## Semántica (paridad operador)

| Acción | existence | reserved |
|--------|-----------|----------|
| Confirm UNVERIFIED → VERIFIED | `-= qty` | `-= qty` |
| Reject UNVERIFIED → DELETED | sin cambio | `-= qty` |
| Ya VERIFIED / DELETED | sin re-aplicar stock | |

## UI

- `SaleDetail`: botones Confirmar / Rechazar solo en `UNVERIFIED`
- Diálogos con texto de política de stock
- Re-sync productos tras decisión

```bash
npm run test:unit
```

## Siguiente

Smoke E2E tienda → dash confirm/reject, o cierre checklist QA Core1 del panel.
