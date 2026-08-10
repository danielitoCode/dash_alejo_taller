# Fase 7.1 — Cierre formal de alineación Core 1 (back-office)

**Estado:** HECHO (exit de **alineación de código**)  
**Fecha:** 2026-08-10  
**Contrato vigente:** [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md)

> **Qué cierra 7.1:** el trabajo de implementación para que el dash respete las mismas reglas de stock/venta que tienda y operador.  
> **Qué no cierra 7.1:** ejecución del smoke 6.2 ni el checklist QA formal.

**Siguiente:** [`PHASE_7_2_PRE_QA_GATE.md`](./PHASE_7_2_PRE_QA_GATE.md).

---

## 1. Criterio de exit de alineación (código)

| # | Criterio | Evidencia |
|---|----------|-----------|
| 1 | `available = max(0, existence − reserved)` | `Product.availableStock`, freeze |
| 2 | Panel no crea B2C ni soft-hold | `BackofficeSalePolicy`, `create` bloqueado |
| 3 | Confirm = operador (`existence−=`, `reserved−=`) | `ConfirmSaleFromPanelCaseUse` |
| 4 | Reject = operador (solo `reserved−=`) | `RejectSaleFromPanelCaseUse` |
| 5 | Idempotencia VERIFIED/DELETED | Case uses 5.1 / 5.2 |
| 6 | `updateVerified` no bypassa stock | Guard 6.1 |
| 7 | Catálogo no pisa `reserved` | `productToCatalogWriteDTO` |
| 8 | Currency/amount del documento Sale | Fase 4 + `formatSaleMoney` |
| 9 | Roles staff / gates | Fase 3 |
| 10 | Post-decisión: Dexie + UI reactiva | 6.3 + 6.4 |
| 11 | Tests unitarios de políticas stock/roles/sale | `src/test/**/*.unit.test.ts` |
| 12 | Smoke documentado | [`SMOKE_6_2.md`](./SMOKE_6_2.md) |

**Veredicto 7.1:** alineación de código **ACEPTADA**.

---

## 2. Fuera de alcance Core 1 dash

| Tema | Destino |
|------|---------|
| `stock_movements` formales | Core 2 |
| Function Appwrite transaccional | Core 2 |
| Realtime obligatorio en dash | Core 2 (opcional) |
| Merge monorepo | Post-QA Core 1 |
| SaleType DISCOUNT/GIFT desde panel | Operador / Core 2 |

---

## 3. Firma 7.1

| Campo | Valor |
|-------|--------|
| Alineación código vs freeze | **Completa** |
| Bloqueadores de código | Ninguno en 7.1 |
| Listo para gate 7.2 | **Sí** |
