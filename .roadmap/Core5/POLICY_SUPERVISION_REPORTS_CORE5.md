# Core 5 — Política de supervisión y reportes

**Estado:** borrador operativo · rama `Core5` · 2026-09-02  
**Aplica a:** `dash_alejo_taller` (panel).  
**No aplica a:** cliente B2C web/app, MCP B2C (sin KPIs staff).

**Fuente financiera canónica:** [POLICY_SALE_FINANCE_CORE4](../Core4/POLICY_SALE_FINANCE_CORE4.md) · [PARITY_PANEL_OPERATOR](../Core4/PARITY_PANEL_OPERATOR.md)

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

Write a `sale_finance_event`: **solo** flujos de confirm (Core 4). Las pantallas Core 5 **no** llaman `RegisterSaleFinance` ni `create`.

---

## 3. KPIs mínimos (MVP)

### 3.1 Documento (agregado de eventos)

| KPI | Definición |
|-----|------------|
| `revenue` | Σ `event.revenue` en el rango |
| `cogs` | Σ `event.cogs` |
| `margin` | Σ `event.margin` (= revenue − cogs a nivel evento) |
| `count` | Nº de eventos (≈ ventas VERIFIED con finance) |

Rango: por `at` / `atIso` del event (o política explícita documentada si se usa fecha de sale).

### 3.2 Por línea / producto (si hay `lines_json`)

| KPI | Definición |
|-----|------------|
| `lineRevenue` | Σ por `productId` |
| `lineCogs` | Σ `unitCostSnapshot × qty` ya en el event |
| `lineMargin` | Σ `lineMargin` |

Eventos legacy sin líneas: solo KPIs de documento; no inventar desglose.

### 3.3 Operativos (no financieros)

| Indicador | Fuente |
|-----------|--------|
| Pendientes UNVERIFIED | `sale` |
| Aging (antigüedad pendiente) | `sale.createdAt` / `updatedAt` |
| Confirmados / rechazados en período | `sale.verified` |

No mezclar conteos operativos con revenue en el mismo número sin etiqueta clara.

---

## 4. Moneda

- Reportar en la moneda del event (`currency`) o separar buckets USD/CUP.
- **No** convertir en caliente con tasa actual para “reescribir” el pasado, salvo vista explícita de “equivalente hoy” claramente marcada (fuera del MVP si añade complejidad).

---

## 5. Relación con Core 4

| Core 4 | Core 5 |
|--------|--------|
| Escribe event al VERIFIED | Lee events |
| Snapshot congelado | Confía en el snapshot |
| Idempotencia por `sale_id` | Un event = una venta en KPIs |
| Reconcile solo faltantes | Puede invocar reconcile de lectura al cargar resumen (ya en store) |

---

## 6. Fuera de política (explícito)

- Segunda colección de “ingresos diarios” que mute o recalcule COGS.
- Impuestos / retenciones.
- Export contable formal (puede ser post-Core5).
- Dashboard del cliente B2C.
- Reservas de taller (Core 6).
