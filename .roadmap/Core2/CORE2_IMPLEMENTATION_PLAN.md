# Core 2 — Plan de implementación por fases (dash)

**Checklist operativo unificado:** [`CORE2_UNIFIED_CHECKLIST.md`](./CORE2_UNIFIED_CHECKLIST.md)  
**Rama de trabajo:** `Core2` · merges incrementales a `master` cuando el bloque esté verde.  
**Última actualización:** 2026-08-23  
**Estado:** schema Appwrite **✓** · B4.1 ✓  
**Repos:** dash_alejo_taller + AlejoTaller (operador / web)

**Fórmula:** `available = max(0, existence − reserved)` · **COGS:** `last_unit_cost × qty` al VERIFIED.

---

## Registro de avance

```text
Rama: Core2
Fase actual: B4.1 ✓ · siguiente B4.2 resumen finance
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
- [x] Enum `type` cableado en código de repos net
- [x] Permisos staff/operador (no cliente)

### Finanzas de entrada
- [x] `supplier`
- [x] `purchase_entry`
- [x] `purchase_entry_line`
- [x] Enum concepto en código net

### Finanzas de venta
- [x] `sale_finance_event`
- [x] `last_unit_cost` en product
- [x] DTO + **net** repo dash (lectura/escritura según fase)
- [x] Test mapper round-trip

**Salida 2.1 cloud:** ✓  
**Salida 2.1 código (B1):** ✓

---

## Fase 2.2 — Operador (AlejoTaller)

Seguimiento en checklist unificado B2. Dash no es primario.

- [x] salida_venta + finance al VERIFIED (operador) — B2 código

---

## Fase 2.3 — Panel factura / movements / ajuste (dash)

### Lectura
- [x] Listado stock_movements (Inventario → Movimientos)
- [x] Listado/detalle purchase_entry (Inventario → Facturas de entrada)

### Factura entrada
- [x] UX multi-línea + supplier + costs + movement entrada + last_unit_cost (B3.2)

### Atajo
- [x] «Dar entrada» existence (Core 1) formalizado con movement (B3.1)
- [x] Entrada formal preferida vía factura multi-línea; entrada rápida por ítem retirada de UI

### Ajuste / devolución
- [x] Ajuste auditado (B3.3) — RegisterStockAdjustmentCaseUse + modal
- [ ] Devolución si aplica política (fuera de B3.3)

**Salida 2.3:** ✓ código (smoke factura confirmado)

---

## Fase 2.4 — Reportes y cola

- [x] Cola UNVERIFIED por antigüedad (B4.1)
- [ ] Resumen ingresos/COGS/margen (solo VERIFIED) (B4.2)

---

## Fase 2.5 — Reservas

- [ ] Collection + panel (no mezclar Sale tienda)

---

## Fase 2.6 — Cierre

- [ ] Permisos + CI + smoke cruzado + STATUS cerrado

---

## Orden

Ver **CORE2_UNIFIED_CHECKLIST.md** (B1 → B6).
