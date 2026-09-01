# Core 4 — Finanzas de Ventas

**Estado:** abierto · rama `Core4`  
**Dependencias:** Core 2 (cerrado) · Core 3 (compras / `last_unit_cost`; ideal mergeado a `master` antes del merge de Core4)  
**Monorepo espejo:** [AlejoTaller/.roadmap/Core4](https://github.com/danielitoCode/AlejoTaller/tree/Core4/.roadmap/Core4)

## Objetivo

Determinar de forma **consistente, auditable e idempotente** los ingresos, el COGS y el margen de las ventas **confirmadas** (`VERIFIED`), con el costo **congelado en el momento de la confirmación**.

```text
COGS = unit_cost_snapshot × quantity
margin = revenue − COGS
```

## Evaluación respecto a Core 2

Core 2 ya entregó una **base financiera operativa**:

| Ya existe (Core 2) | Gap que cierra Core 4 |
|--------------------|------------------------|
| `sale_finance_event` al VERIFIED (panel + operador) | Contrato formal + política escrita |
| COGS = `last_unit_cost × qty` en el momento del confirm | **Snapshot explícito** por línea (no solo total agregado) |
| Margen a nivel documento | Margen **por línea** (revenue/cogs/margin por producto) |
| Idempotencia por `sale_id` | Tests de estabilidad histórica + reconciliación |
| `UNVERIFIED` / `DELETED` sin finance | Reglas documentadas y smoke de no-regresión |
| `FinanceSummaryPanel` lectura | Sin segunda contabilidad; lectura solo de eventos fuente |

Core 4 **no reinventa** finanzas: **madura** el modelo para que el histórico no dependa de re-leer el producto y para que Core 5 reporte con fuente canónica estable.

## Documentos

| Doc | Rol |
|------|-----|
| [POLICY_SALE_FINANCE_CORE4.md](./POLICY_SALE_FINANCE_CORE4.md) | Quién escribe, cuándo, snapshot, exclusiones |
| [SCHEMA_AUDIT_CORE4.md](./SCHEMA_AUDIT_CORE4.md) | Campos actuales vs snapshot / líneas |
| [CORE4_UNIFIED_CHECKLIST.md](./CORE4_UNIFIED_CHECKLIST.md) | Orden B0–B6 (DASH + AT) |
| [MVP_CORE4_STATUS.md](./MVP_CORE4_STATUS.md) | Estado vivo + smokes |

## Alcance

- Contrato de `sale_finance_event` (documento + detalle de líneas con snapshot).
- Revenue solo de ventas `VERIFIED`.
- COGS con costo aplicable **al confirmar**.
- Snapshot del costo usado (histórico estable si cambia `last_unit_cost` después).
- Margen por venta y por línea.
- Idempotencia de eventos (reconfirm / reintento no duplica).
- Exclusión de `UNVERIFIED` y `DELETED`.
- Paridad panel (dash) ↔ operador (AlejoTaller scan).
- Tests unitarios e integración del contrato financiero.

## Fuera de alcance

- Contabilidad general / doble partida.
- Reportes y KPIs avanzados → **Core 5**.
- Reservas de taller → **Core 6**.
- FIFO/LIFO por lote (sigue método **último costo** salvo decisión explícita futura).
- Anulación de ventas ya VERIFIED con reversión financiera (si se necesita, post-Core4).

## Orden lógico

```text
B0 política + audit → B1 contrato snapshot/líneas → B2 dash confirm
  → B3 operador AT → B4 idempotencia/reconcile → B5 tests/paridad → B6 smoke + PR
```

## Criterio de merge a `master`

| Condición | ¿Merge? |
|---|---|
| B0 + B1 + B2 + B4 + B5 (dash) | Sí — panel con snapshot estable |
| B3 (operador) | **Sí** para release completo (paridad) |
| B6 CI verde | Obligatorio |
| Reportes Core 5 | No bloquean Core 4 |

## Siguiente Core

Core 5 — Supervisión y reportes (lee eventos fuente; no recalcula a ojo).
