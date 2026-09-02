# Core 5 — Política de supervisión y reportes

**Estado:** **aceptada** (B0 · 2026-09-02) · rama `Core5`  
**Aplica a:** `dash_alejo_taller` (panel).  
**No aplica a:** cliente B2C web/app, MCP B2C (sin KPIs staff).

**Fuente financiera canónica:** [POLICY_SALE_FINANCE_CORE4](../Core4/POLICY_SALE_FINANCE_CORE4.md) · [PARITY_PANEL_OPERATOR](../Core4/PARITY_PANEL_OPERATOR.md)

---

## Evaluación vs `.policies/` (B0)

| Política existente | ¿Core 5 la redefine? | Acción |
|--------------------|----------------------|--------|
| `sale/SALE_POLICY` | **No** — estados UNVERIFIED/VERIFIED/DELETED e impacto stock intactos | Sin cambio de dominio ni de tests de confirm/reject |
| `warehouse/*` | **No** — soft-hold / existence / reserved no se tocan | — |
| `exchange/*` | **No** — no convierte tasa para reescribir histórico (MVP) | Alineado: buckets por `currency` del event |
| `panel/PANEL_POLICY` | **No** — solo refuerza “panel = supervisión” | Sin cambio de reglas de auth/UX obligatorias |
| `auth/*`, `product/*`, `notification/*` | **No** | — |
| Core 4 finance (roadmap) | **Complementa** (lectura) | Write sigue solo en confirm |

**Conclusión B0:** aceptar esta política **no** obliga a reescribir `.policies` de dominio ni el ecosistema de tests de stock/venta. Solo se añade un puntero en `.policies/README.md` (lectura / reportes).

---

## 1. Principio

Los reportes **leen**; no **reescriben** el dinero.

```text
VERIFIED + sale_finance_event  → cuenta en KPIs financieros
UNVERIFIED / DELETED           → no suman revenue/cogs/margin
last_unit_cost actual          → no se usa para rehacer el pasado
```

Cualquier pantalla de Core 5 que muestre margen o COGS debe trazarse a `sale_finance_event` (documento y, si aplica, `lines_json`).

---

## 2. Quién lee qué

| Actor (rol panel) | Finance KPIs | Cola ventas | Stock (lectura) |
|-------------------|--------------|-------------|-----------------|
| owner / admin | Sí | Sí | Sí |
| sales | Sí (según política de roles vigente) | Sí | Limitado si aplica |
| operator (si existe en panel) | Solo si el rol lo permite | Cola operativa | No reportes globales |
| cliente / anónimo | **No** | **No** | **No** |

Write a `sale_finance_event`: **solo** flujos de confirm (Core 4). Las pantallas Core 5 **no** llaman `RegisterSaleFinance` ni `create` (salvo reconcile de faltantes ya existente en `finance.store`, documentado en Core 4).

---

## 3. KPIs mínimos (MVP)

### 3.1 Documento (agregado de eventos)

| KPI | Definición |
|-----|------------|
| `revenue` | Σ `event.revenue` en el rango |
| `cogs` | Σ `event.cogs` |
| `margin` | Σ `event.margin` |
| `count` | Nº de eventos |

Rango: por `at` / `atIso` del event vía `listByDateRange`.

### 3.2 Por línea / producto (si hay `lines`)

| KPI | Definición |
|-----|------------|
| `lineRevenue` / `lineCogs` / `lineMargin` | Σ por `productId` desde `lines` |

Legacy sin líneas: solo KPIs de documento.

### 3.3 Operativos (no financieros)

Pendientes UNVERIFIED, aging, confirm/reject — fuente `sale`; no mezclar con revenue sin etiqueta.

---

## 4. Moneda

Reportar por `currency` del event (`byCurrency` ya en `FinanceSummary`). No convertir en caliente para reescribir el pasado (MVP).

---

## 5. Relación con Core 4

| Core 4 | Core 5 |
|--------|--------|
| Escribe event al VERIFIED | Lee events |
| Snapshot congelado | Confía en el snapshot |
| Idempotencia por `sale_id` | Un event = una venta en KPIs |

---

## 6. Fuera de política

Segunda colección de ingresos recalculados, impuestos, export contable formal, dashboard B2C, Core 6 reservas.
