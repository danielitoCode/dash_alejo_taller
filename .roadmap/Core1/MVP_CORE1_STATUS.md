# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-10  
**Veredicto:** Fases 1–5 + **6.1** (coherencia / no segundo hold). QA manual pendiente.

## Fase 6 — Coherencia

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **6.1** No B2C create / no segundo hold / no verify sin stock | **Hecho** | Policy + CreateSale + UpdateSaleVerified guard + catalog write sin reserved |
| 6.2 Smoke tienda → dash (manual) | Pendiente (post-alineación / pre-QA formal) |

### 6.1 garantías

1. `create` net + offline-first → `assertBackofficeCannotCreateB2cSale`
2. `CreateSaleFromPanelCaseUse` → siempre rechaza
3. `UpdateSaleVerifiedCaseUse` **no** acepta VERIFIED/DELETED (forzar confirm/reject)
4. `productToCatalogWriteDTO` omite `reserved` (no pisa soft-hold de tienda)
5. UI Ventas/Reservas: solo supervisión; sin “nueva venta”

```bash
npm run test:unit
```

## Alineación Core 1 (código)

| Área | Estado |
|------|--------|
| Modelo reserved/available | ✓ |
| Catálogo existence ≥ reserved | ✓ |
| Roles staff | ✓ |
| Ventas currency + filtros | ✓ |
| Confirm/reject + stock | ✓ |
| No origen B2C / no segundo hold | ✓ |

**Siguiente:** cerrar alineación (opcional 6.2 smoke) y luego checklist QA.
