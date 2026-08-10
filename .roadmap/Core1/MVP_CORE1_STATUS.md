# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-10  
**Veredicto:** Fase 4 completa; **5.1 Confirm con stock** hecho.

## Fase 5 — Escritura stock

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **5.1** Confirm VERIFIED + stock | **Hecho** | `ConfirmSaleFromPanelCaseUse` + `applyStockDeltas` + UI |
| **5.2** Reject DELETED + release reserved | Pendiente |
| **5.3** Idempotencia / UI dialogs | Parcial (confirm idempotente + dialog) |

## 5.1 semántica (paridad operador)

| Acción | existence | reserved |
|--------|-----------|----------|
| Confirm UNVERIFIED → VERIFIED | `-= qty` | `-= qty` |
| Ya VERIFIED | sin cambio | sin cambio |
| DELETED | no se confirma | — |

- Re-read Appwrite por producto antes de mutar (como `AppwriteOperatorStockRepository`)
- Orden: stock → `buy_state=VERIFIED`
- `setVerified` deprecado para no saltarse stock

```bash
npm run test:unit
```

## Siguiente

**5.2** `RejectSaleFromPanelCaseUse` (solo `reserved -= qty`).
