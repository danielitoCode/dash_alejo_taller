# Core 4 — Checklist unificado (dash + AlejoTaller)

**Última actualización:** 2026-09-01  
**Rama:** `Core4` en ambos repos.  
**Release mínimo:** B0–B2 + B4 + B5 (dash) + B3 (operador) + B6.

Convención: **DASH** = `dash_alejo_taller` · **AT** = `AlejoTaller` · **BOTH** = ambos.

---

## B0 — Baseline, política y schema

- [x] **BOTH** Core 2 confirmado: `sale_finance_event` al VERIFIED; UNVERIFIED/DELETED sin finance
- [x] **BOTH** Core 3: dependencia de `last_unit_cost` documentada (merge Core3 a master recomendado antes del merge Core4)
- [x] **DASH** Política [POLICY_SALE_FINANCE_CORE4.md](./POLICY_SALE_FINANCE_CORE4.md) aceptada
- [x] **DASH** [SCHEMA_AUDIT_CORE4.md](./SCHEMA_AUDIT_CORE4.md) completado (actual vs propuesto)
- [x] **DASH** Decisión de diseño: **Opción A** (`lines_json` en el documento) — MVP
- [x] **DASH** Lista de atributos Appwrite a provisionar: `lines_json` (string, size generoso, opcional en docs legacy)
- [x] **AT** Política espejada en `.roadmap/Core4/`

**Salida B0:** **completa** 2026-09-01.

---

## B1 — Contrato de dominio (snapshot + líneas)

**DEP:** B0

- [x] **DASH** Extender entidad `SaleFinanceEvent` con líneas (`SaleFinanceLine`: productId, qty, unitPrice, unitCostSnapshot, lineRevenue, lineCogs, lineMargin)
- [x] **DASH** Actualizar `buildFinanceEventFromSale` para rellenar snapshot por línea y totales consistentes
- [x] **DASH** Mapper DTO ↔ dominio (incl. serialización `lines_json`)
- [x] **DASH** `RegisterSaleFinanceFromVerifiedCaseUse` usa el nuevo contrato sin romper idempotencia por `sale_id` (vía `buildFinanceEventFromSale`)
- [x] **DASH** Tipado / validaciones: costs ≥ 0, qty > 0, margin = revenue − cogs a nivel doc y línea
- [x] **AT** Espejo de tipos/`SaleFinanceWrite` + `SaleFinanceLineWrite` + repo `lines_json`
- [x] **DASH** Tests unitarios build + mapper (legacy sin lines + round-trip lines_json)

**Salida B1:** **completa** 2026-09-01 (dominio + mappers + tipos AT). Wiring de confirm con líneas pobladas en runtime → B2/B3.

**Pendiente operativo (no bloquea B1):** provisionar atributo `lines_json` en consola Appwrite antes del smoke de B2.

---

## B2 — Confirm panel (dash)

**DEP:** B1

- [ ] **DASH** `ConfirmSaleFromPanelCaseUse` (o flujo equivalente) genera evento con **snapshot por línea**
- [ ] **DASH** COGS del documento = Σ (unitCostSnapshot × qty)
- [ ] **DASH** No se genera finance en transiciones que no sean a VERIFIED
- [ ] **DASH** Si el producto no tiene `last_unit_cost`, snapshot = 0 y log/warn (sin fallar el confirm de stock)
- [ ] **DASH** Lectura `FinanceSummaryPanel` / store sigue agregando solo eventos fuente (sin segunda contabilidad)
- [ ] **DASH** Provisionar atributo `lines_json` en Appwrite; smoke create/read del nuevo campo

**Salida B2:** panel confirma venta → evento estable con detalle de líneas.

---

## B3 — Confirm operador (AlejoTaller scan)

**DEP:** B1 (contrato) · paridad con B2

- [ ] **AT** `ApplyOperatorStockDecisionCaseUse` (VERIFIED) escribe finance con **mismo** snapshot por línea
- [ ] **AT** `OperatorSaleFinanceRepository.createIdempotent` acepta/persiste el detalle
- [ ] **AT** DELETED sigue sin finance y sin `salida_venta` financiera
- [ ] **AT** Idempotencia por `sale_id` intacta (reintento operador no duplica)
- [ ] **AT** Cliente web / MCP: **sin** write a `sale_finance_event` (solo frontera)

**Salida B3:** paridad panel ↔ operador en el contrato financiero.

---

## B4 — Idempotencia, estabilidad histórica y reconcile

**DEP:** B2 (mínimo)

- [ ] **DASH** Test/caso: existe event → segundo `execute` devuelve el mismo y **no** recalcula con `last_unit_cost` nuevo
- [ ] **DASH** Test/caso: tras VERIFIED, cambiar `product.last_unit_cost` **no** altera el evento almacenado
- [ ] **DASH** Reconcile de resumen (si existe) solo **crea faltantes**; nunca sobrescribe eventos existentes con costos actuales
- [ ] **AT** Misma garantía en `createIdempotent`

**Salida B4:** histórico financiero congelado; reintentos seguros.

---

## B5 — Tests y paridad

**DEP:** B1–B4 según superficie

- [x] **DASH** Unit: `buildFinanceEventFromSale` con varias líneas y costos distintos *(B1)*
- [ ] **DASH** Unit: margen doc = Σ márgenes línea (o documentar redondeo cuando revenue = sale.amount)
- [x] **DASH** Unit: mapper round-trip con `lines_json` *(B1)*
- [ ] **DASH** Unit: `RegisterSaleFinanceFromVerifiedCaseUse` idempotente
- [ ] **DASH** Unit: UNVERIFIED/DELETED no invocan create (o guard en capa superior cubierto)
- [ ] **AT** Unit/instrumented: COGS operador con snapshot; idempotencia
- [ ] **BOTH** Nota de paridad: mismos campos semánticos panel vs operador

**Salida B5:** suite verde en módulos tocados.

---

## B6 — Permisos, smoke y cierre

- [ ] **DASH** Permisos Appwrite: cliente sin write finance; roles de confirm OK
- [ ] **DASH** Smoke UI: cola/detalle → confirmar venta → event con líneas/snapshot visible en log o detalle dev
- [ ] **DASH** Smoke: UNVERIFIED no crea event; REJECT no crea event
- [ ] **AT** Smoke operador (dispositivo o emulador): confirm → finance; reject → no finance
- [ ] **DASH** CI verde en PR `Core4` → `master`
- [ ] **AT** CI módulos tocados verde en PR espejo
- [ ] **BOTH** Documentación STATUS actualizada a cerrado
- [ ] **BOTH** PR mergeado cuando estable (no a producción hasta verde)

### Criterio de merge

| Condición | ¿Merge? |
|---|---|
| B0+B1+B2+B4+B5 dash | Sí — panel con snapshot |
| + B3 operador | **Sí** — release completo paridad |
| B6 CI | Obligatorio |
| Reportes Core 5 | No bloquean |

---

## Registro

| Fecha | Nota |
|---|---|
| 2026-09-01 | Apertura rama `Core4` ambos repos; docs B0 (README, policy, schema audit, checklist, status) |
| 2026-09-01 | B0 cerrado: Opción A `lines_json`; B1 dominio/mappers/tests dash + tipos/repo AT |
