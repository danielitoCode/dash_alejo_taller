# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto:** Fase 4 lectura ventas **4.1–4.3 hechos**.

## Fase 4 — Ventas lectura

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **4.1** Filtros por estado | **Hecho** | Tabs + util |
| **4.2** Detalle completo | **Hecho** | SaleDetail |
| **4.3** Currency en UI | **Hecho** | `formatSaleMoney` en listado + detalle; no fuerza USD |
| **4.4** Origen solo lectura | Base en detalle |

## 4.3

- Util: `formatSaleMoney(amount, currency)` / `saleCurrencyCode`
- Listado: amount + pill de código (CUP, USD, …)
- Tooltip de líneas con la misma moneda del documento
- Sin currency en doc → número plano (sin `$` inventado)

```bash
npm run test:unit
```

## Siguiente

**4.4** formalizar “no crear venta B2C desde panel” · o **Fase 5** confirm/reject + stock.
