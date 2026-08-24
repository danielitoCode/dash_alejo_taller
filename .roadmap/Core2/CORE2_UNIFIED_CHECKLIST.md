# Core 2 — Checklist unificado (cliente + backoffice + operador)

**Espejo operativo.** Fuente de trabajo compartida con AlejoTaller.  
**Rama:** `Core2` en **ambos** repos · merge a **master** vía PR.

**Última actualización:** 2026-08-24  
**Core 2 cerrado (DoD código + smokes + CI + permisos):** **SÍ**  
**Merge a master:** pendiente de PR

### Reglas

1. Implementar en `Core2` (cliente + dash + operador).
2. Al cerrar tarea → `[x]` aquí y en `CORE2_IMPLEMENTATION_PLAN.md` del repo tocado.
3. Checks Appwrite/dispositivo → **tú**. Código → agente.
4. Política de core inferior solo cambia si un core superior la actualiza y se documenta.

### Fórmulas congeladas

- `available = max(0, existence − reserved)`
- COGS = `last_unit_cost × qty` al VERIFIED
- Cliente **no** escribe movements / purchase / finance / workshop_reservation (staff write)
- **Alta de stock** solo vía **factura de entrada** (no atajo por ítem en UI)

---

## Bloque 0 — Baseline (hecho)

- [x] Rama `Core2` (AlejoTaller + dash)
- [x] Soft-hold Core 1 (cliente + operador existence/reserved)
- [x] Dash entrada formalizada en Core 2 vía factura (B3.2); atajo «Dar entrada» retirado de UI
- [x] Appwrite collections + permisos staff/operador (no cliente):
  - [x] `stock_movements`
  - [x] `supplier`
  - [x] `purchase_entry` / `purchase_entry_line`
  - [x] `sale_finance_event`
  - [x] `last_unit_cost` en product
  - [x] `workshop_reservation`
- [x] Políticas documentadas (POLICY_DELTAS + FINANCE_MODEL)
- [x] (dash) dominio/DTO/mapper inventory/purchase/finance en rama Core2

---

## Bloque 1 — Contrato dominio + DTO/repo net (hecho)

- [x] Enums en código: movement types + purchase concepts
- [x] Net repos Appwrite dash: movements, purchase_*, finance
- [x] Net repos operador: movements + finance write en confirm (con B2)
- [x] Constantes collection IDs (`APPWRITE_COLLECTIONS`)
- [x] Tests mapper/DTO round-trip (inventory/purchase/finance)

---

## Bloque 2 — Operador traza VERIFIED (AlejoTaller)

- [x] `salida_venta` + balance_after + sale_id + user_id
- [x] sale_finance_event (revenue, cogs, margin)
- [x] Sin finance en UNVERIFIED; sin salida en DELETED
- [x] Idempotencia + tests unitarios
- [x] Paridad equivalente smokeada desde backoffice (B4)
- [ ] Smoke dispositivo operador (opcional; no bloquea cierre)

---

## Bloque 3 — Dash entrada formal + listados (hecho)

- [x] Factura multi-línea purchase_entry + lines + existence + movement (**B3.2**)
- [x] Tests case-use RegisterPurchaseEntry + last_unit_cost
- [x] Ajuste auditado (B3.3) — RegisterStockAdjustmentCaseUse + UI Ajustar
- [x] Listados movements + facturas (B3.3) — vista Inventario / InventoryTrace
- [x] Producto nuevo dentro de factura de entrada; catálogo crea con existence 0
- [x] **Smoke:** factura multi-línea → docs en Appwrite (2026-08-23)
- [ ] Smoke ajuste (opcional)

---

## Bloque 4 — Reportes + cola UNVERIFIED (dash) ✓

- [x] Cola por antigüedad (B4.1)
- [x] Resumen ingresos/COGS/margen solo VERIFIED (B4.2)
- [x] Confirm panel → `sale_finance_event` + **`salida_venta`** (paridad)
- [x] Reconciliación VERIFIED previos; tooltips + responsive
- [x] Badges nav pendientes (Ventas / Reservas) + UX ventas/detalle
- [x] **Smoke:** confirm venta → VERIFIED + finance + salida_venta (2026-08-24)

---

## Bloque 5 — Reservas taller ✓

- [x] Collection Appwrite `workshop_reservation` + permisos staff
- [x] Dominio + DTO + net repo + mapper + panel Reservas
- [x] Tests unitarios mapper / factory
- [x] **Smoke:** crear reserva en UI → Appwrite (2026-08-24)
- [ ] (Opcional) solicitud desde cliente web — fuera del DoD de cierre

---

## Bloque 6 — CI, permisos, cierre ✓

- [x] Permisos auditados en consola Appwrite (staff vs cliente por colección/rol) — 2026-08-24
- [x] CI verde en Core2 (dash quality + unit tests; cliente/operador en verde) — 2026-08-24
- [x] **Smoke cruzado final:** factura entrada → pedido UNVERIFIED → confirm backoffice →  
  `entrada` + `salida_venta` + `sale_finance_event` + KPIs — 2026-08-24
- [ ] Merge PR Core2 → **master** (dash + AlejoTaller)
- [x] STATUS / checklist DoD código+smokes+CI+permisos = cerrado

---

## Orden final

```text
B0 ✓ → B1 ✓ → B2 ✓ → B3 ✓ → B4 ✓ → B5 ✓ → B6 ✓ (salvo merge master)
```

## Registro

| Fecha | Ítem | Nota |
|-------|------|------|
| 2026-08-18 | B0–B1 | Schema + net repos |
| 2026-08-19 | B2 operador | salida_venta + finance |
| 2026-08-21 | B3.1–B3.2 | Entrada + factura multi-línea |
| 2026-08-23 | B3.3–B5 | Ajuste, cola, finance, reservas |
| 2026-08-24 | Paridad + smokes B4/B5 + cruzado | Confirm panel + Appwrite OK |
| 2026-08-24 | Política UI stock | Solo factura de entrada; sin Dar entrada por ítem |
| 2026-08-24 | B6 | CI verde + permisos Appwrite confirmados |
| 2026-08-24 | Cierre docs | Core 2 DoD listo; merge PR pendiente |
