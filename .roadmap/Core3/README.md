# Core 3 — Compras y Abastecimiento

**Estado:** en preparación · rama `Core3`  
**Dependencia:** Core 2 cerrado (2026-08-24)  
**Monorepo espejo:** [AlejoTaller/.roadmap/Core3](https://github.com/danielitoCode/AlejoTaller/tree/Core3/.roadmap/Core3)

## Evaluación respecto al plan original

El README histórico de Core 3 listaba proveedores, `purchase_entry`, costos y movimientos `entrada`. **Gran parte de ese MVP ya se entregó en Core 2**:

| Ítem del plan original Core 3 | Estado real post–Core 2 |
|------------------------------|-------------------------|
| Factura multi-línea | ✓ `RegisterPurchaseEntryCaseUse` |
| `purchase_entry` + líneas | ✓ schema + UI registrar entrada |
| `last_unit_cost` | ✓ al confirmar entrada (concepto compra) |
| Movimiento `entrada` | ✓ `stock_movements` |
| Stock vía contrato Core 1/2 | ✓ `existence +=` |
| CRUD proveedores + historial/auditoría fuertes | **pendiente → este Core 3** |
| Anulación/corrección de entradas | **pendiente → este Core 3** |
| Alertas / reorden mínimo | **opcional Core 3** |

**Core 3 no reinventa la factura de entrada.** La **madura**: gobierno de proveedores, historial auditables, edge cases y endurecimiento de permisos/UX de compras.

## Objetivo

Tener un ciclo de **abastecimiento operable y auditables** en el panel: quién suministra, qué se compró, a qué costo, y poder consultar/corregir sin romper el contrato de stock de Core 1–2.

## Alcance (sí)

- CRUD **proveedores** (`supplier`) con UI dedicada
- Historial de **facturas de entrada** (filtros, detalle, trazas a movements)
- Auditoría (quién / cuándo / costos / `entry_id` en movements)
- Política de **anulación o corrección** de entradas (compensación de stock + traza)
- Endurecimiento validaciones (existencia ≥ reserved tras compensación, costos ≥ 0)
- Tests de integración del dominio `purchase` / `supplier`
- Documentación de política de compras (espejo en AlejoTaller)

## Fuera de alcance (no)

- COGS / margen de ventas (ya Core 2; profundización = Core 4 histórico)
- Reportes financieros avanzados (Core 5)
- Reservas de taller
- Cuentas por pagar formales / contabilidad de doble partida
- FIFO/LIFO por lote (futuro)
- Ajuste de inventario genérico (post–Core 2, aparte)
- Escritura de compras desde cliente B2C u operador

## Superficie por repo

| Repo | Rol en Core 3 |
|------|----------------|
| **dash_alejo_taller** (este) | **Primario** — UI y case uses de proveedores, historial, anulación/corrección |
| **AlejoTaller** | **Secundario** — políticas espejo, permisos cliente/operador, no rotura de COGS al actualizar `last_unit_cost`; sin UI de compras |

## Orden lógico (resumen)

```text
B0 Políticas + schema gaps (ambos docs)
  → B1 Proveedores CRUD (dash)
  → B2 Historial / detalle compras (dash)  [usa B1]
  → B3 Anulación/corrección (dash)        [usa B2 + contrato stock Core2]
  → B4 Permisos + smoke (dash)
  → B5 Espejo AlejoTaller (políticas, guardas, tests lectura costo)
  → B6 CI + checklist cierre → merge master
```

Detalle: [`CORE3_UNIFIED_CHECKLIST.md`](./CORE3_UNIFIED_CHECKLIST.md)

## Criterio de merge a `master`

Recomendar merge **solo cuando**:

1. Checklist B0–B6 marcado en ambos repos (espejo AlejoTaller en su `Core3`)
2. CI verde en `Core3` (dash +, si aplica, monorepo)
3. Smoke manual: crear proveedor → factura entrada → ver historial → (si implementado) anular/corregir sin romper `available`
4. Cliente B2C y operador **no** pueden escribir `supplier` / `purchase_*`
5. Confirm VERIFIED sigue generando COGS coherente tras nuevas entradas

**No mergear** a mitad de B3 (compensaciones de stock a medias).

## Siguiente núcleo

Core 4 (histórico) — profundización finanzas de ventas / snapshots de costo, si aún aplica tras lo ya entregado en Core 2.
