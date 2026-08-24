# MVP Core 2 — Estado vivo

**Rama:** `Core2`  
**Última actualización:** 2026-08-24  
**Core 2 cerrado (código + smokes + CI + permisos):** **SÍ**  
**Merge a `master`:** pendiente de PR

## Resumen

| Bloque | Estado |
|--------|--------|
| B0 Baseline | ✓ |
| B1 Dominio/DTO/net | ✓ |
| B2 Operador traza | ✓ |
| B3 Entrada formal / factura | ✓ |
| B4 Cola + finance + paridad | ✓ |
| B5 Reservas taller | ✓ |
| B6 CI + permisos + smokes | ✓ |
| Merge master | ⏳ PR |

## Políticas Core 2 (vigentes)

- Soft-hold: `available = max(0, existence − reserved)`
- COGS al VERIFIED: `last_unit_cost × qty` (no promedio)
- Cliente no escribe `stock_movements`, `purchase_*`, `sale_finance_event`, `workshop_reservation`
- Alta de stock **solo** vía factura de entrada (multi-línea; producto nuevo permitido en factura)
- Confirm backoffice = paridad operador: `salida_venta` + finance event
- Reservas taller ≠ ventas de tienda

## Cierre B6 confirmado

1. CI verde (backoffice + cliente/operador) — 2026-08-24
2. Permisos Appwrite alineados por rol/colección — 2026-08-24
3. Smoke cruzado pasado — 2026-08-24

## Siguiente paso

Merge PR `Core2` → `master` en **dash_alejo_taller** y **AlejoTaller**.
