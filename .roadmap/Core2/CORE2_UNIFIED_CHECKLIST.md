# Core 2 — Checklist unificado (cliente + backoffice + operador)

**Espejo operativo.** Fuente de trabajo compartida con AlejoTaller.  
**Rama:** `Core2` en **ambos** repos · **master** solo con merges recomendados.

**Última actualización:** 2026-08-18  
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
- [x] Dash «Dar entrada» existence delta (sin movement formal aún en path Core 1)
- [x] Appwrite collections + permisos staff/operador (no cliente):
  - [x] `stock_movements`
  - [x] `supplier`
  - [x] `purchase_entry` / `purchase_entry_line`
  - [x] `sale_finance_event`
  - [x] `last_unit_cost` en product
- [x] Políticas documentadas (POLICY_DELTAS + FINANCE_MODEL)
- [x] (dash) dominio/DTO/mapper inventory/purchase/finance en rama Core2 (si presente)

---

## Bloque 1 — Contrato dominio + DTO/repo net

- [ ] Enums en código: movement types + purchase concepts
- [ ] Net repos Appwrite dash: movements, purchase_*, finance (lectura/escritura según rol)
- [ ] Net repos operador: movements + finance write en confirm
- [ ] Constantes collection IDs
- [ ] Tests mapper/DTO round-trip

**Siguiente foco:** completar B1 net repos.

---

## Bloque 2 — Operador traza VERIFIED (AlejoTaller)

- [ ] `salida_venta` + balance_after + sale_id + user_id
- [ ] sale_finance_event (revenue, cogs, margin)
- [ ] Sin finance en UNVERIFIED; sin salida en DELETED
- [ ] Idempotencia + tests + smoke (tú)

---

## Bloque 3 — Dash entrada formal + listados

- [ ] Dar entrada → también `stock_movements` tipo `entrada`
- [ ] Factura multi-línea purchase_entry + lines + existence + movement
- [ ] Ajuste auditado
- [ ] Listados movements + facturas
- [ ] Tests case-use

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

- [ ] Permisos auditados
- [ ] CI verde en Core2
- [ ] Smoke cruzado entrada → pedido → confirm → salida_venta + finance
- [ ] STATUS cerrado ambos repos

---

## Orden

```text
B0 ✓ → B1 → B2 ∥ B3 → B4 → B5 → B6
```

## Registro

| Fecha | Ítem | Nota |
|-------|------|------|
| 2026-08-18 | B0 schema cloud | Confirmado equipo |
| 2026-08-18 | Checklist unificado | Rama Core2 |
