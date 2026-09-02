# Core 4 — Checklist unificado (dash + AlejoTaller)

**Última actualización:** 2026-09-02  
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

**Salida B1:** **completa** 2026-09-01.

---

## B2 — Confirm panel (dash)

**DEP:** B1

- [x] **DASH** `ConfirmSaleFromPanelCaseUse` genera evento con **snapshot por línea** (vía `buildFinanceEventFromSale`)
- [x] **DASH** COGS del documento = Σ (unitCostSnapshot × qty) — smoke: cogs=6 con línea 2×3
- [x] **DASH** No se genera finance en transiciones que no sean a VERIFIED (contrato Core2 + guards)
- [x] **DASH** Si el producto no tiene `last_unit_cost`, snapshot = 0 (smoke: `p-vmm3da` legacy → 0)
- [x] **DASH** Lectura `FinanceSummaryPanel` / store sigue agregando solo eventos fuente
- [x] **DASH** Atributo `lines_json` provisionado en Appwrite; smoke create/read OK 2026-09-01

**Salida B2:** **completa** 2026-09-01 — panel confirma → event con `lines_json` válido (cogs/margin coherentes).

---

## B3 — Confirm operador (AlejoTaller scan)

**DEP:** B1 (contrato) · paridad con B2

- [x] **AT** `ApplyOperatorStockDecisionCaseUse` (VERIFIED) escribe finance con **mismo** snapshot por línea (código en `Core4`)
- [x] **AT** `OperatorSaleFinanceRepository.createIdempotent` acepta/persiste el detalle (`lines_json`)
- [x] **AT** DELETED sigue sin finance (test unitario)
- [x] **AT** Idempotencia por `sale_id` intacta (test unitario)
- [x] **AT** Cliente web / MCP: **sin** write a `sale_finance_event` (frontera; sin cambios que abran write)
- [ ] **AT** Smoke runtime dispositivo/emulador confirm → `lines_json` (opcional; código listo)

**Salida B3:** **código completo** 2026-09-01; smoke dispositivo pendiente (no bloquea avanzar B4).

---

## B4 — Idempotencia, estabilidad histórica y reconcile

**DEP:** B2 (mínimo)

- [x] **DASH** Test/caso: existe event → segundo `execute` devuelve el mismo y **no** recalcula con `last_unit_cost` nuevo *(unit 2026-09-02)*
- [x] **DASH** Test/caso: tras VERIFIED, cambiar `product.last_unit_cost` **no** altera el evento almacenado *(unit: frozen event + cost lookup 999/50)*
- [x] **DASH** Reconcile de resumen solo **crea faltantes**; nunca sobrescribe eventos existentes (`salesMissingFinanceEvent` + store)
- [x] **AT** Misma garantía en `createIdempotent` + 2º confirm con costo vivo distinto *(unit 2026-09-02)*

**Salida B4:** histórico financiero congelado; reintentos seguros — **BOTH unit 2026-09-02**.

---

## B5 — Tests y paridad

**DEP:** B1–B4 según superficie

- [x] **DASH** Unit: `buildFinanceEventFromSale` con varias líneas y costos distintos *(B1)*
- [ ] **DASH** Unit: margen doc = Σ márgenes línea (o documentar redondeo cuando revenue = sale.amount)
- [x] **DASH** Unit: mapper round-trip con `lines_json` *(B1)*
- [x] **DASH** Unit: `RegisterSaleFinanceFromVerifiedCaseUse` idempotente *(B4 2026-09-02)*
- [ ] **DASH** Unit: UNVERIFIED/DELETED no invocan create (o guard en capa superior cubierto)
- [x] **AT** Unit: COGS operador con snapshot + lines; costo ausente → 0; idempotencia *(B3)*
- [x] **AT** Unit B4: no-reescritura con `last_unit_cost` distinto *(2026-09-02)*
- [ ] **BOTH** Nota de paridad: mismos campos semánticos panel vs operador

**Salida B5:** suite verde en módulos tocados.

---

## B6 — Permisos, smoke y cierre

- [ ] **DASH** Permisos Appwrite: cliente sin write finance; roles de confirm OK
- [x] **DASH** Smoke UI: confirmar venta → event con líneas/snapshot *(B2 2026-09-01)*
- [ ] **DASH** Smoke: REJECT no crea event (rápido de validar)
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
| 2026-09-01 | Apertura rama `Core4` ambos repos; docs B0 |
| 2026-09-01 | B0 cerrado Opción A; B1 dominio/mappers/tests dash + tipos/repo AT |
| 2026-09-01 | `lines_json` provisionado; B2 smoke panel OK (cogs/margin/lines); B3 código operador + unit tests |
| 2026-09-02 | B4 dash: unit no-reescritura RegisterSaleFinance + salesMissingFinanceEvent |
| 2026-09-02 | B4 AT: unit 2º confirm + createIdempotent conserva snapshots (FakeFinanceRepo paridad Appwrite) |
