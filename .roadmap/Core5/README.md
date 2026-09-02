# Core 5 — Supervisión y reportes

**Estado:** abierto · rama `Core5` · 2026-09-02  
**Dependencias:** Core 2–4 (finance fuente canónica con snapshot)  
**Espejo AT:** [AlejoTaller/.roadmap/Core5](https://github.com/danielitoCode/AlejoTaller/tree/Core5/.roadmap/Core5)

## Objetivo

Exponer **supervisión operativa y reportes financieros** en el panel, consumiendo **solo** datos ya persistidos — en particular `sale_finance_event` (Core 4) — **sin recalcular** costos ni reescribir el histórico.

```text
Fuente financiera  = sale_finance_event (+ lines_json)
Fuente operativa   = sale, stock (lectura), movements (lectura)
Prohibido          = create/update finance desde reportes; COGS “a ojo”
```

## Qué ya existe (no reinventar)

| Base | Origen |
|------|--------|
| `sale_finance_event` + `lines_json` | Core 4 |
| `FinanceSummaryPanel` / `finance.store.loadSummary` | Core 2–4 |
| `aggregateFinanceSummary` | Core 2 |
| Cola de ventas / confirm-reject | Core 1–2 |

Core 5 **madura** lectura y UI de supervisión; no cambia el contrato de write de Core 4.

## Documentos

| Doc | Rol |
|------|-----|
| [POLICY_SUPERVISION_REPORTS_CORE5.md](./POLICY_SUPERVISION_REPORTS_CORE5.md) | Quién lee, qué KPIs, exclusiones |
| [CORE5_UNIFIED_CHECKLIST.md](./CORE5_UNIFIED_CHECKLIST.md) | Orden B0–B5 (DASH + notas AT) |
| [MVP_CORE5_STATUS.md](./MVP_CORE5_STATUS.md) | Estado vivo |

## Alcance (dash)

- KPIs: revenue, COGS, margen por rango de fechas / moneda.
- Desglose por producto (vía `lines_json`).
- Supervisión: pendientes UNVERIFIED, aging, confirm vs reject (lectura).
- Roles: visibilidad según owner/admin/sales.
- Tests de agregación de solo lectura.

## Fuera de alcance

- Contabilidad doble partida, impuestos, FIFO/LIFO.
- Anulación financiera de venta VERIFIED.
- Write a `sale_finance_event` desde pantallas de reporte.
- Reservas de taller → **Core 6**.
- Reportes B2C en cliente web / MCP.

## Orden lógico

```text
B0 política + inventario de lectura
  → B1 contrato de agregados / KPIs
  → B2 UI resumen financiero (madurar panel)
  → B3 desglose por producto / líneas
  → B4 supervisión operativa (cola + indicadores)
  → B5 tests + roles + PR
```

## Criterio de merge a `master`

| Condición | ¿Merge? |
|---|---|
| B0–B2 + B5 (resumen fiable) | Sí — MVP supervisión |
| + B3 desglose producto | Recomendado |
| + B4 cola/aging | Recomendado para release completo |
| CI verde | Obligatorio |
