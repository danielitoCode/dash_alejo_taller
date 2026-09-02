# Core 5 — Checklist unificado (dash + notas AT)

**Última actualización:** 2026-09-02  
**Rama:** `Core5` en ambos repos.  
**Release mínimo:** B0 + B1 + B2 + B5 (dash). B3/B4 recomendados.

Convención: **DASH** = `dash_alejo_taller` · **AT** = `AlejoTaller` (frontera / espejo docs).

---

## B0 — Baseline y política

- [ ] **DASH** Core 4 en `master` (o docs de cierre mergeados): `lines_json` + política finance legibles
- [ ] **DASH** [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) aceptada
- [ ] **DASH** Inventario de lectura actual: `FinanceSummaryPanel`, `finance.store`, `aggregateFinanceSummary`, listado ventas
- [ ] **AT** Docs `.roadmap/Core5/` espejo (frontera: sin KPIs B2C)

**Salida B0:** política + mapa de lo existente.

---

## B1 — Contrato de agregados (solo lectura)

**DEP:** B0

- [ ] **DASH** Tipos / helpers de KPI de período (revenue, cogs, margin, count) documentados
- [ ] **DASH** Agregación por rango sobre `SaleFinanceEvent[]` (extender o envolver `aggregateFinanceSummary`)
- [ ] **DASH** Regla: sin `lines` → sin desglose producto inventado
- [ ] **DASH** Unit: agregados coherentes con Σ events; event legacy sin lines

**Salida B1:** contrato de lectura testeable.

---

## B2 — UI resumen financiero (MVP)

**DEP:** B1

- [ ] **DASH** Panel/resumen: rango de días o from–to, KPIs principales
- [ ] **DASH** Carga vía store/repo de **solo lectura** (reconcile faltantes opcional, como hoy)
- [ ] **DASH** Empty / error / loading usables
- [ ] **DASH** Smoke manual: período con events conocidos vs totales

**Salida B2:** owner ve revenue/cogs/margen del período desde events.

---

## B3 — Desglose por producto (líneas)

**DEP:** B1 · datos Core 4 con `lines_json`

- [ ] **DASH** Agregar por `productId` desde `lines`
- [ ] **DASH** UI tabla o lista top productos por margen / revenue
- [ ] **DASH** Unit: Σ lineCogs del desglose = cogs de events con lines (en fixture)

**Salida B3:** margen por producto sin releer `last_unit_cost`.

---

## B4 — Supervisión operativa

**DEP:** B0 (puede ir en paralelo a B2)

- [ ] **DASH** Indicadores: count UNVERIFIED, aging simple, confirm/reject en período
- [ ] **DASH** Enlace a detalle de venta / cola existente (no rehacer el módulo de ventas)
- [ ] **DASH** Etiquetas claras: operativos ≠ financieros

**Salida B4:** supervisión de cola además del dinero.

---

## B5 — Roles, tests, frontera, PR

- [ ] **DASH** Respeto de roles de lectura (alineado a RoleConfig / rutas)
- [ ] **DASH** Unit de agregados + smoke residual
- [ ] **DASH** Ningún path de reporte llama `RegisterSaleFinance` / `create` finance
- [ ] **AT** Confirmado: web/MCP sin reportes staff ni write finance
- [ ] **BOTH** STATUS actualizado; PR `Core5` → `master` con CI verde

**Salida B5:** cierre release mínimo o completo según B3/B4.

---

## Criterio de merge

| Condición | ¿Merge? |
|---|---|
| B0+B1+B2+B5 | Sí — MVP |
| + B3 + B4 | Release supervisión completo |
| CI | Obligatorio |

---

## Registro

| Fecha | Nota |
|---|---|
| 2026-09-02 | Apertura rama `Core5` ambos repos; política + checklist |
