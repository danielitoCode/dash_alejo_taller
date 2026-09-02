# Core 4 — Finanzas de Ventas

**Estado:** **CERRADO** (2026-09-02) · rama `Core4` · PR [#21](https://github.com/danielitoCode/dash_alejo_taller/pull/21) → `master`  
**Dependencias:** Core 2 (cerrado) · Core 3 (compras / `last_unit_cost`)  
**Monorepo espejo:** [AlejoTaller/.roadmap/Core4](https://github.com/danielitoCode/AlejoTaller/tree/Core4/.roadmap/Core4) · PR [#28](https://github.com/danielitoCode/AlejoTaller/pull/28)

## Objetivo (cumplido)

Ingresos, COGS y margen de ventas **VERIFIED** de forma **consistente, auditable e idempotente**, con costo **congelado al confirmar**.

```text
COGS = unit_cost_snapshot × quantity
margin = revenue − COGS
```

## Entregado

| Bloque | Resultado |
|--------|-----------|
| B0 | Política + schema Opción A (`lines_json`) |
| B1 | Contrato dominio + mapper + tipos AT |
| B2 | Confirm panel + smoke `lines_json` |
| B3 | Operador AT write con snapshot (unit) |
| B4 | No-reescritura / reconcile solo faltantes (BOTH unit) |
| B5 | Margen doc vs líneas + paridad panel↔operador |
| B6 | Frontera REJECT/MCP/web; unit; PRs; checklist permisos Appwrite |

## Documentos

| Doc | Rol |
|------|-----|
| [POLICY_SALE_FINANCE_CORE4.md](./POLICY_SALE_FINANCE_CORE4.md) | Política operativa |
| [PARITY_PANEL_OPERATOR.md](./PARITY_PANEL_OPERATOR.md) | Campos canónicos panel ↔ operador |
| [SCHEMA_AUDIT_CORE4.md](./SCHEMA_AUDIT_CORE4.md) | Schema / `lines_json` |
| [CORE4_UNIFIED_CHECKLIST.md](./CORE4_UNIFIED_CHECKLIST.md) | Checklist B0–B6 cerrado |
| [MVP_CORE4_STATUS.md](./MVP_CORE4_STATUS.md) | Estado final |
| [B6_PERMISSIONS_AND_BOUNDARY.md](./B6_PERMISSIONS_AND_BOUNDARY.md) | Frontera + permisos |

## Fuera de alcance (siguiente)

- Reportes / KPIs → **Core 5** (lee eventos fuente; no recalcula).
- Reservas de taller → **Core 6**.
- Anulación financiera de venta ya VERIFIED (post-Core4 si se define).

## Merge

Merge a `master` vía PR #21 con **CI verde**. Verificación operativa en Appwrite: rol cliente sin write a `sale_finance_event` ([B6_PERMISSIONS](./B6_PERMISSIONS_AND_BOUNDARY.md)).
