# Core 5 — Checklist de implementación · **dash_alejo_taller**

**Rama:** `Core5`  
**Última actualización:** 2026-09-02  
**Política:** [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md)  
**Release mínimo:** B0 + B1 + B2 + B5. **Completo:** + B3 + B4.

Este repo **implementa** supervisión y reportes. No escribe `sale_finance_event` desde pantallas de reporte (solo lectura + reconcile de faltantes ya existente en store).

---

## B0 — Baseline e inventario

**Objetivo:** saber qué hay y no tocar write Core 4 por error.

- [ ] Confirmar en `master`/rama: Core 4 finance (`SaleFinanceEvent`, `lines`, `buildFinanceEventFromSale`, register idempotente)
- [ ] Aceptar [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md)
- [ ] Inventariar lectura actual y anotar rutas reales:
  - [ ] `src/core/feature/finance/domain/util/aggregateFinanceSummary.ts`
  - [ ] `src/core/feature/finance/presentation/viewmodel/finance.store.ts` (`loadSummary`)
  - [ ] UI: localizar `FinanceSummaryPanel` (o equivalente en routes/components)
  - [ ] Listado / cola de ventas (módulo `sale` presentation)
- [ ] Anotar en STATUS: “B0 inventario OK” + paths

**Salida:** mapa de archivos + política aceptada. **Siguiente:** B1.

---

## B1 — Contrato de agregados (solo lectura)

**Objetivo:** KPIs de período testeables sobre `SaleFinanceEvent[]`.

- [ ] Revisar / documentar tipo `FinanceSummary` (revenue, cogs, margin, count u equivalentes)
- [ ] Extender o envolver `aggregateFinanceSummary`:
  - [ ] Σ revenue / cogs / margin / count en rango (el rango lo aplica el repo/listByDateRange; el agregador suma events ya filtrados)
  - [ ] Opcional: bucket por `currency` si hay multi-moneda en el mismo listado
- [ ] Helper de desglose por producto **solo si hay `lines`** (puede vivir en B3; en B1 al menos la regla documentada: sin lines → sin inventar)
- [ ] Unit tests en `src/test/core/feature/finance/`:
  - [ ] Σ de N events = summary
  - [ ] Event legacy sin `lines` no rompe agregado documento
  - [ ] Lista vacía → empty summary

**Archivos típicos**

| Acción | Path |
|--------|------|
| Agregador | `.../finance/domain/util/aggregateFinanceSummary.ts` |
| Tests | `src/test/core/feature/finance/aggregateFinanceSummary.unit.test.ts` (o nuevo) |

**Salida:** tests verdes de agregación. **Siguiente:** B2.

---

## B2 — UI resumen financiero (MVP)

**Objetivo:** el staff ve revenue / COGS / margen del período desde events.

- [ ] UI de resumen (madurar panel existente o ruta dedicada):
  - [ ] Selector de rango (días predefinidos y/o from–to)
  - [ ] Cards o filas: revenue, cogs, margin, nº eventos
  - [ ] Estados loading / empty / error
- [ ] Cableado solo a `financeStore.loadSummary` (o case use de lectura nuevo que **no** registre finance salvo reconcile ya existente)
- [ ] No añadir botones de “recalcular COGS” ni edición de events
- [ ] Smoke manual: período con ventas VERIFIED conocidas vs totales del panel

**Salida:** smoke resumen OK. **Siguiente:** B3 o B4 en paralelo; B5 al cerrar.

---

## B3 — Desglose por producto (`lines_json`)

**Objetivo:** top productos por revenue/margen usando snapshot Core 4.

- [ ] Función pura: `aggregateByProduct(events) → { productId, lineRevenue, lineCogs, lineMargin, qty }[]`
- [ ] Ignorar events sin `lines` / `lines.length === 0` en el desglose (sí pueden seguir en totales doc)
- [ ] Unit: fixture multi-línea; Σ lineCogs del desglose acotado a events con lines
- [ ] UI: tabla o lista ordenable (margen o revenue)
- [ ] **Prohibido:** leer `product.last_unit_cost` para rehacer el desglose histórico

**Salida:** desglose usable en panel.

---

## B4 — Supervisión operativa (cola)

**Objetivo:** indicadores de flujo de ventas, separados del dinero.

- [ ] Contadores (lectura `sale`):
  - [ ] UNVERIFIED abiertos (count)
  - [ ] Aging simple (p. ej. pendientes > 24h / > 72h)
  - [ ] VERIFIED vs DELETED en el mismo rango de fechas del resumen (o rango propio documentado)
- [ ] UI: bloque “Operación” distinto del bloque “Finanzas” (etiquetas claras)
- [ ] Enlaces a listado/detalle de ventas ya existentes (no reescribir el módulo sale)
- [ ] No sumar UNVERIFIED al revenue

**Salida:** supervisión de cola visible junto al resumen financiero.

---

## B5 — Roles, calidad, frontera de write, PR

- [ ] Rutas/panel de reportes respetan roles (owner/admin/sales según RoleConfig vigente)
- [ ] Grep / revisión: ningún componente de reporte llama `registerFromVerified` / `RegisterSaleFinance` excepto el reconcile ya acotado en `finance.store` (documentar si se mantiene)
- [ ] Unit agregados + CI verde en rama `Core5`
- [ ] Actualizar [MVP_CORE5_STATUS.md](./MVP_CORE5_STATUS.md) y este checklist
- [ ] PR `Core5` → `master` (coordinar con AT si solo hubo docs allí)

**Salida:** mergeable con CI verde.

---

## Orden de trabajo recomendado

```text
B0 → B1 → B2 → (B3 ∥ B4) → B5
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-02 | Checklist DASH de implementación creado |
