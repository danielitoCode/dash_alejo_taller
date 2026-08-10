# Fase 7.1 — Cierre formal de alineación Core 1 (back-office)

**Estado:** HECHO (exit de **alineación de código**)  
**Fecha:** 2026-08-10  
**Contrato vigente:** [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md)

> **Qué cierra 7.1:** el trabajo de implementación para que el dash respete las mismas reglas de stock/venta que tienda y operador.  
> **Qué no cierra 7.1:** ejecución del smoke 6.2 en staging ni el checklist QA formal (siguientes pasos operativos).

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

**Veredicto 7.1:** alineación de código **ACEPTADA** para pasar a verificación operativa.

---

## 2. Mapa de fases cumplidas

| Fase | Contenido | Estado |
|------|-----------|--------|
| 0.x | Freeze, secretos, inventario | Hecho |
| 1–2 | Modelo stock + validaciones catálogo | Hecho |
| 3 | Auth staff / gates | Hecho |
| 4 | Ventas lectura + currency | Hecho |
| 5 | Confirm / reject + stock | Hecho |
| 6.1–6.4 | Coherencia, smoke doc, Dexie, UI | Hecho |
| **7.1** | **Exit alineación** | **Hecho** |

---

## 3. Fuera de alcance Core 1 dash (no reabrir en alineación)

| Tema | Destino |
|------|---------|
| `stock_movements` formales | Core 2 |
| Function Appwrite transaccional confirm+stock | Core 2 / compartida con operador |
| Realtime obligatorio en dash | Core 2 (opcional) |
| Merge monorepo | Después de Core 1 formal (post-QA) |
| SaleType DISCOUNT/GIFT desde panel | Core 2 / operador primario |

---

## 4. Puerta siguiente (operativa)

```text
7.1 ALIGNMENT EXIT (código)  ✓
        │
        ▼
Ejecutar SMOKE_6_2.md en staging     ← tú / equipo
        │
        ▼
QA_CORE1_CHECK_plan.md en verde      ← cierre formal Core 1 dash
        │
        ▼
Core 2 / monorepo (opcional)
```

### Comandos mínimos pre-smoke

```bash
npm run test:unit
npm run check   # si existe en package.json
npm run build
```

---

## 5. Firma de cierre 7.1

| Campo | Valor |
|-------|--------|
| Alineación código vs freeze | **Completa** |
| Bloqueadores conocidos de código | Ninguno documentado en 7.1 |
| Bloqueador operativo | Smoke 6.2 sin ejecutar |
| Listo para QA formal | **Sí**, tras smoke en verde |

**Fin de la serie de implementación Core 1 del panel.**  
Cualquier cambio de semántica de stock de aquí en adelante requiere **revisar el freeze**, no improvisar en UI.
