# Core 2 — Plan de implementación por fases (dash)

**Checklist operativo unificado:** [`CORE2_UNIFIED_CHECKLIST.md`](./CORE2_UNIFIED_CHECKLIST.md)  
**Rama de trabajo:** `Core2` · merges incrementales a `master` cuando el bloque esté verde.  
**Última actualización:** 2026-08-18  
**Estado:** schema Appwrite **✓** · ejecución código formal ~10% (baseline + dominio parcial)  
**Repos:** dash_alejo_taller + AlejoTaller (operador / web)

**Fórmula:** `available = max(0, existence − reserved)` · **COGS:** `last_unit_cost × qty` al VERIFIED.

---

## Registro de avance

```text
Rama: Core2
Fase actual: B1 net repos (schema cloud ✓)
Core 2 cerrado: NO
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

### Movimientos de stock
- [x] Collection `stock_movements` en Appwrite
- [x] Campos canónicos (product_id, type, quantity, balance_after, reason, user_id, sale_id?, …)
- [ ] Enum `type` cableado en código de repos net
- [x] Permisos staff/operador (no cliente)

### Finanzas de entrada
- [x] `supplier`
- [x] `purchase_entry`
- [x] `purchase_entry_line`
- [ ] Enum concepto en código net

### Finanzas de venta
- [x] `sale_finance_event`
- [x] `last_unit_cost` en product
- [ ] DTO + **net** repo dash (lectura/escritura según fase)
- [ ] Test mapper round-trip (completar si falta)

**Salida 2.1 cloud:** ✓  
**Salida 2.1 código (B1):** pendiente net repos

---

## Fase 2.2 — Operador (AlejoTaller)

Seguimiento en checklist unificado B2. Dash no es primario.

- [ ] salida_venta + finance al VERIFIED (operador)

---

## Fase 2.3 — Panel factura / movements / ajuste (dash)

### Lectura
- [ ] Listado stock_movements
- [ ] Listado/detalle purchase_entry

### Factura entrada
- [ ] UX multi-línea + supplier + costs + movement entrada + last_unit_cost

### Atajo
- [x] «Dar entrada» existence (Core 1) — **debe** pasar a escribir movement en B3
- [ ] Atajo genera movement (+ costo opcional)

### Ajuste / devolución
- [ ] Ajuste auditado
- [ ] Devolución si aplica política

---

## Fase 2.4 — Reportes y cola

- [ ] Cola UNVERIFIED por antigüedad
- [ ] Resumen ingresos/COGS/margen (solo VERIFIED)

---

## Fase 2.5 — Reservas

- [ ] Collection + panel (no mezclar Sale tienda)

---

## Fase 2.6 — Cierre

- [ ] Permisos + CI + smoke cruzado + STATUS cerrado

---

## Orden

Ver **CORE2_UNIFIED_CHECKLIST.md** (B1 → B6).
