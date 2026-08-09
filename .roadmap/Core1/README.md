# Core 1 — Back-office alineado (Auth staff + Catálogo + Ventas + Soft-hold)

**Estado:** documentación y checklist listos; implementación pendiente de paridad con AlejoTaller Core 1.  
**Criterio de cierre:** checklist `QA_CORE1_CHECK_plan.md` en verde en el panel + no contradicción con soft-hold de clientes/operador.

**Última actualización:** 2026-08-09

## Qué incluye Core 1 (dash)

- **Auth staff:** roles `owner` / `admin` / `sales` / `viewer`; rutas por rol; sin acceso de cliente final ni visitante de tienda.
- **Catálogo:** CRUD producto/categoría con campos de stock alineados: `existence`, `reserved`, `available = existence − reserved`.
- **Ventas (supervisión):** listar/filtrar pedidos; verificar o rechazar **solo** con la misma semántica que el operador (`VERIFIED` consume, `DELETED` libera `reserved`); mostrar **currency e importe del cliente** sin reconversión arbitraria.
- **Warehouse (competencia panel):** ajustar `existence` (entradas manuales mínimas) **sin** escribir `reserved` como si fuera stock libre; no inventar un segundo soft-hold paralelo.
- **Seguridad mínima:** no secretos en frontend de mutaciones críticas; `.env` fuera de git; roles no elevables por `sales`/`viewer`.
- **QA:** checklist manual del panel + humo cruzado con una venta creada desde la tienda.

## Qué NO incluye (va a Core 2)

- Collection `stock_movements` y reportes formales.
- Ajustes/devoluciones avanzados, multi-almacén.
- Sustituir al operador móvil (`alejotallerscan`) como único canal de piso.
- Migración completa del dash al monorepo AlejoTaller.
- Appwrite Function transaccional de warehouse.

## Índice de este directorio

| Archivo | Descripción |
|---------|-------------|
| [QA_CORE1_CHECK_plan.md](./QA_CORE1_CHECK_plan.md) | **Checklist QA** del panel back-office |
| [MVP_CORE1_STATUS.md](./MVP_CORE1_STATUS.md) | Estado de fases / micro-tareas Core 1 dash |
| [ALIGNMENT_WITH_ALEJOTALLER.md](./ALIGNMENT_WITH_ALEJOTALLER.md) | Mapa de paridad con monorepo + gaps conocidos |

**Políticas:** `.policies/auth`, `.policies/sale`, `.policies/warehouse`, `.policies/product`, `.policies/panel`
