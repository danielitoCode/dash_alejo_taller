# Core 2 — Checklist unificado (cliente + backoffice + operador)

**Espejo operativo.** Fuente de trabajo compartida con AlejoTaller.  
**Rama:** `Core2` en **ambos** repos · **master** solo con merges recomendados.

**Última actualización:** 2026-08-24 (smokes B3–B5 + paridad confirm backoffice + UX ventas)  
**Core 2 cerrado:** NO — falta B6 (permisos audit, smoke cruzado final, merge)

### Reglas

1. Implementar en `Core2` (cliente + dash + operador).
2. Al cerrar tarea → `[x]` aquí y en `CORE2_IMPLEMENTATION_PLAN.md` del repo tocado.
3. Checks Appwrite/dispositivo → **tú**. Código → agente.
4. Política de core inferior solo cambia si un core superior la actualiza y se documenta.

### Fórmulas congeladas

- `available = max(0, existence − reserved)`
- COGS = `last_unit_cost × qty` al VERIFIED
- Cliente **no** escribe movements / purchase / finance

---

## Bloque 0 — Baseline (hecho)

- [x] Rama `Core2` (AlejoTaller + dash)
- [x] Soft-hold Core 1 (cliente + operador existence/reserved)
- [x] Dash «Dar entrada» existence delta (Core 1; formalizado en B3.1)
- [x] Appwrite collections + permisos staff/operador (no cliente):
  - [x] `stock_movements`
  - [x] `supplier`
  - [x] `purchase_entry` / `purchase_entry_line`
  - [x] `sale_finance_event`
  - [x] `last_unit_cost` en product
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
- [ ] **Smoke tuyo (opcional dispositivo):** confirm en app operador → docs en Appwrite  
  *(paridad equivalente ya smokeada desde backoffice — ver B4)*

---

## Bloque 3 — Dash entrada formal + listados (hecho)

- [x] Dar entrada → también `stock_movements` tipo `entrada` (B3.1)
- [x] Tests case-use (RegisterStockEntry + movement entrada)
- [x] Factura multi-línea purchase_entry + lines + existence + movement (**B3.2**)
- [x] Tests case-use RegisterPurchaseEntry + last_unit_cost
- [x] Ajuste auditado (B3.3) — RegisterStockAdjustmentCaseUse + UI Ajustar
- [x] Listados movements + facturas (B3.3) — vista Inventario / InventoryTrace
- [x] **Smoke tuyo:** factura multi-línea → docs en Appwrite (2026-08-23)
- [ ] **Smoke tuyo (opcional):** ajuste de stock → movement tipo `ajuste` en Appwrite

---

## Bloque 4 — Reportes + cola UNVERIFIED (dash) ✓

- [x] Cola por antigüedad (B4.1) — sortSalesForQueue + badges en Ventas
- [x] Resumen ingresos/COGS/margen solo VERIFIED (B4.2)
  - [x] `aggregateFinanceSummary` + tests
  - [x] `FinanceSummaryPanel` en Dashboard (estilo empresarial)
  - [x] Confirm desde panel → escribe `sale_finance_event` (COGS = last_unit_cost × qty)
  - [x] Reconciliación de VERIFIED previos sin evento (botón Actualizar)
  - [x] Tooltips en KPIs + responsivo multi-breakpoint (desktop / tablet / móvil)
- [x] **Paridad backoffice:** confirm desde panel → `salida_venta` en `stock_movements` (2026-08-24)
- [x] **Smoke tuyo:** confirm venta pendiente → VERIFIED + finance + salida_venta (2026-08-24)
- [x] UX: badge pendientes en nav (Ventas / Reservas) + cards/detalle ventas minimalistas

---

## Bloque 5 — Reservas taller ✓

- [x] Collection Appwrite `workshop_reservation` + permisos staff (consola)
- [x] Dominio + DTO + net repo + mapper (dash)
- [x] Panel dash: listado / alta / cambio de estado (Reservas)
- [ ] (Opcional) solicitud desde cliente web — **fuera del DoD de cierre Core2**
- [x] Tests unitarios mapper / factory
- [x] **Smoke tuyo:** crear reserva en UI → documento en Appwrite (2026-08-24)

---

## Bloque 6 — CI, permisos, cierre ← **siguiente / cierre**

- [ ] Permisos auditados (consola Appwrite) — repaso final staff vs cliente
- [x] CI verde en Core2 (svelte-check + unit tests) — revalidar tras último push UX
- [x] PRs abiertos Core2 → master (dash #1, AlejoTaller #11)
- [ ] **Smoke cruzado final (15 min):**  
  factura entrada → pedido cliente UNVERIFIED → confirm backoffice →  
  `stock_movements` (`entrada` + `salida_venta`) + `sale_finance_event` + KPIs finance
- [ ] Merge PRs Core2 → **master** (tú en GitHub, ambos repos)
- [ ] STATUS cerrado ambos repos (`Core 2 cerrado: SÍ`)

---

## Orden

```text
B0 ✓ → B1 ✓ → B2 ✓ → B3 ✓ → B4 ✓ → B5 ✓
  → B6 cierre ← pendiente (permisos, smoke cruzado, merge master)
```

## Registro

| Fecha | Ítem | Nota |
|-------|------|------|
| 2026-08-18 | B0 schema cloud | Confirmado equipo |
| 2026-08-18 | Checklist unificado | Rama Core2 |
| 2026-08-19 | B1 dash net repos + tests | APPWRITE_COLLECTIONS + StockMovement/Purchase/Finance net |
| 2026-08-19 | B2 operador | salida_venta + finance + tests unitarios |
| 2026-08-21 | B3.1 Dar entrada → movement entrada | dash RegisterStockEntryCaseUse + unit tests |
| 2026-08-21 | CI Core2 verde | dash a78b7c4; operador 9ef3378 |
| 2026-08-21 | PRs merge | dash #1 · AlejoTaller #11 |
| 2026-08-21 | B3.2 factura multi-línea | dash RegisterPurchaseEntryCaseUse + UI + tests |
| 2026-08-23 | B3.3 ajuste + Inventario | dash RegisterStockAdjustment + InventoryTrace UI + RoleConfig inventory |
| 2026-08-23 | B4.1 cola UNVERIFIED | dash sortSalesByAge + SaleManagement badges |
| 2026-08-23 | B4.2 resumen finance | aggregate + panel + confirm escribe event + reconcile + tooltips/responsive |
| 2026-08-23 | B5 reservas taller | collection workshop_reservation + dominio/repo/UI Reservas |
| 2026-08-23 | Smoke B3.2 | Factura 2 productos → Appwrite OK |
| 2026-08-24 | Paridad confirm panel | ConfirmSaleFromPanel → salida_venta + finance |
| 2026-08-24 | Smoke B4 + B5 | Confirm venta + reserva taller verificados en Appwrite |
| 2026-08-24 | UX ventas / nav | Badges pendientes, cards/detalle minimalistas, nombre producto en líneas |
