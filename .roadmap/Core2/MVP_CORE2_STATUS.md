# MVP Core 2 — Estado vivo

**Rama:** `Core2`  
**Última actualización:** 2026-08-24  
**Core 2 cerrado:** **NO**

## Hecho (código + smokes)

| Bloque | Estado | Notas |
|--------|--------|-------|
| B0 Baseline | ✓ | Schema Appwrite + políticas |
| B1 Dominio/DTO/net | ✓ | Movements, purchase, finance |
| B2 Operador traza | ✓ código | Smoke dispositivo opcional |
| B3 Entrada formal | ✓ | Factura multi-línea smoke OK; ajuste opcional |
| B4 Cola + finance | ✓ | Confirm panel → finance + **salida_venta** (paridad) |
| B5 Reservas taller | ✓ | Smoke reserva UI → Appwrite OK |
| UX backoffice | ✓ | Badges nav, cards/detalle ventas, tooltips |

## Pendiente inmediato (B6 — cierre)

1. **Permisos** — auditoría rápida en consola Appwrite (staff escribe movements/finance/purchase/reservation; cliente no).
2. **Smoke cruzado final (~15 min):**
   - Factura de entrada (2 líneas) → movements `entrada` + `last_unit_cost`
   - Pedido cliente → UNVERIFIED + reserved
   - Confirm desde backoffice → VERIFIED + `salida_venta` + `sale_finance_event` + KPIs
3. **CI verde** en el último commit de `Core2` (revalidar Actions).
4. **Merge** PR Core2 → `master` (dash + AlejoTaller).
5. Marcar **Core 2 cerrado: SÍ** en checklist + status de ambos repos.

## Opcional (no bloquea merge)

- Smoke ajuste de stock (B3.3)
- Smoke confirm desde app operador (B2 dispositivo) — paridad ya cubierta en panel
- Solicitud de reserva desde cliente web

## Cómo cerrar

Ver DoD en `CORE2_IMPLEMENTATION_PLAN.md` + bloque B6 del checklist unificado.
