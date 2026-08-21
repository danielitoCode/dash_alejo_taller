# Core 2 — Checklist unificado (cliente + backoffice + operador)

**Espejo operativo.** Fuente de trabajo compartida con AlejoTaller.  
**Rama:** `Core2` en **ambos** repos · **master** solo con merges recomendados.

**Última actualización:** 2026-08-21 (B3.2 factura)  
**Core 2 cerrado:** NO

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

## Bloque 1 — Contrato dominio + DTO/repo net

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
- [ ] **Smoke tuyo:** confirm en dispositivo → docs en Appwrite

---

## Bloque 3 — Dash entrada formal + listados

- [x] Dar entrada → también `stock_movements` tipo `entrada` (B3.1)
- [x] Tests case-use (RegisterStockEntry + movement entrada)
- [x] Factura multi-línea purchase_entry + lines + existence + movement (**B3.2**)
- [x] Tests case-use RegisterPurchaseEntry + last_unit_cost
- [ ] Ajuste auditado
- [ ] Listados movements + facturas
- [ ] **Smoke tuyo:** Dar entrada / factura → docs en Appwrite

---

## Bloque 4 — Reportes + cola UNVERIFIED (dash)

- [ ] Cola por antigüedad
- [ ] Resumen ingresos/COGS/margen (solo VERIFIED)

---

## Bloque 5 — Reservas taller

- [ ] Collection + panel dash
- [ ] (Opcional) solicitud cliente web

---

## Bloque 6 — CI, permisos, cierre

- [ ] Permisos auditados (consola Appwrite)
- [x] CI verde en Core2 (dash quality + operador unit tests)
- [x] PRs abiertos Core2 → master (dash #1, AlejoTaller #11)
- [ ] Merge PRs a master (tú en GitHub)
- [ ] Smoke cruzado entrada → pedido → confirm → salida_venta + finance
- [ ] STATUS cerrado ambos repos

---

## Orden

```text
B0 ✓ → B1 ✓ → B2 ✓ código → B3.1 ✓ → B3.2 ✓ código → smoke (tú)
  → B3.3 ajuste/listados ← siguiente  ·  B4 → B5 → B6
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
| 2026-08-21 | B3.2 factura multi-línea | dash | RegisterPurchaseEntryCaseUse + UI + tests |
