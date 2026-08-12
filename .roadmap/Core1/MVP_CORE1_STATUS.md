# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-12  
**Veredicto:** **Core 1 dash cerrado** (DoD D1–D5 cumplidos en sesión QA 2026-08-12).  
**Core 1 dash cerrado:** ☑ **SÍ** — fecha **2026-08-12**

| Hito | Estado |
|------|--------|
| Código 0 → 6.4 | ✓ |
| 7.1 Exit alineación | ✓ |
| 7.2 Pre-QA gate | ✓ (doc + validación operativa en staging) |
| 7.3 DoD + hoja QA | ✓ **DoD formal = SÍ** |
| Smoke confirm / reject | ✓ (sesión 2026-08-12) |
| QA checklist 15 min | ✓ §0–§5, §7 · §6 roles viewer opcional abierto |

## Qué quedó cerrado

- Soft-hold / stock: `available = max(0, existence − reserved)`
- Entrada de stock (delta «Dar entrada»), no set de existence en catálogo
- Pedido tienda → `reserved += qty`, `existence` intacto
- Confirmar → `existence` y `reserved` bajan
- Rechazar → solo `reserved` baja
- Ventas pendientes (UI ámbar, detalle, botones)
- Realtime / refresco listado productos y ventas
- Filtro + purge de usuarios anónimos

## Pendiente no bloqueante (post–Core 1)

| Ítem | Prioridad | Notas |
|------|-----------|--------|
| §6 QA: viewer no muta stock/ventas | Baja | Checklist 100%; no bloquea DoD stock |
| Registro formal Gate A en `PHASE_7_2` | Baja | CI ya ejecuta unit/check/build |
| Realtime cross-device si Pulse no está en env | Media | Appwrite RT + fan-out local cubren panel |
| Core 2 / monorepo / reservas de taller | Roadmap | Menú Reservas = placeholder de agenda |

## Documentos 7.x

| Doc | Rol |
|-----|-----|
| [PHASE_7_1_ALIGNMENT_EXIT.md](./PHASE_7_1_ALIGNMENT_EXIT.md) | Código alineado |
| [PHASE_7_2_PRE_QA_GATE.md](./PHASE_7_2_PRE_QA_GATE.md) | Gates A–D |
| [PHASE_7_3_CORE1_DOD.md](./PHASE_7_3_CORE1_DOD.md) | **Definition of Done** + registro de cierre |
| [QA_CORE1_CHECK_plan.md](./QA_CORE1_CHECK_plan.md) | QA 15 min (marcado PASS) |
| [SMOKE_6_2.md](./SMOKE_6_2.md) | Smoke cruzado |
| [CANONICAL_RULES_FREEZE.md](./CANONICAL_RULES_FREEZE.md) | Reglas no negociables |
