# Core 2 — Plan de implementación por fases (dash)

**Checklist operativo unificado:** [`CORE2_UNIFIED_CHECKLIST.md`](./CORE2_UNIFIED_CHECKLIST.md)  
**Rama de trabajo:** `Core2` · merge a `master` vía PR.  
**Última actualización:** 2026-08-24  
**Estado:** **Core 2 cerrado** (código + smokes + CI + permisos) · merge master pendiente  
**Repos:** dash_alejo_taller + AlejoTaller (operador / web)

**Fórmula:** `available = max(0, existence − reserved)` · **COGS:** `last_unit_cost × qty` al VERIFIED.

---

## Registro de avance

```text
Rama: Core2
Fase actual: B6 ✓ (CI + permisos + smokes)
Core 2 cerrado (DoD): SÍ
Merge master: pendiente PR
```

---

## Fase 2.0 — Alcance y políticas delta

- [x] Plan por fases
- [x] README + STATUS + POLICY_DELTAS + FINANCE_MODEL
- [x] Modelo financiero aceptado (2026-08-13)
- [x] Reservas de taller en MVP — SÍ
- [x] COGS = último costo
- [x] Espejo alcance en AlejoTaller `.roadmap/Core2/`
- [x] POLICY_DELTAS aceptadas en ambos repos (doc)

**Salida 2.0:** ✓

---

## Fase 2.1 — Schema stock + finanzas

- [x] Collections + permisos staff (no cliente)
- [x] DTO + net repo + tests mapper

**Salida 2.1:** ✓

---

## Fase 2.2 — Operador (AlejoTaller)

- [x] salida_venta + finance al VERIFIED

**Salida 2.2:** ✓

---

## Fase 2.3 — Panel factura / movements / ajuste (dash)

- [x] Listados movements + facturas
- [x] UX multi-línea + supplier + costs + movement entrada + last_unit_cost
- [x] Producto nuevo en factura; catálogo sin stock inicial
- [x] Atajo «Dar entrada» por ítem **retirado** (política Core 2)
- [x] Ajuste auditado (B3.3)

**Salida 2.3:** ✓

---

## Fase 2.4 — Reportes y cola

- [x] Cola UNVERIFIED por antigüedad
- [x] Resumen ingresos/COGS/margen (solo VERIFIED)
- [x] Paridad confirm panel → salida_venta + finance

**Salida 2.4:** ✓

---

## Fase 2.5 — Reservas de taller

- [x] Collection + permisos + dominio + panel + smoke

**Salida 2.5:** ✓

---

## Fase 2.6 — Cierre

- [x] Permisos Appwrite auditados por rol
- [x] CI verde (dash + cliente)
- [x] Smoke cruzado final
- [ ] Merge Core2 → master (PR)

**Salida 2.6 DoD código/ops:** ✓ · **merge:** pendiente

---

## Orden

Ver **CORE2_UNIFIED_CHECKLIST.md**.
