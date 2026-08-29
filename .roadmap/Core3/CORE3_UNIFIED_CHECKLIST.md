# Core 3 — Checklist unificado (dash + AlejoTaller)

**Última actualización:** 2026-08-29  
**Rama:** `Core3` en ambos repos.

## B0 — Baseline y política

- [x] **BOTH** Core 2 confirmado sin regresiones
- [x] **DASH** Política de compras Core 3 documentada
- [x] **DASH** Schema auditado
- [x] **DASH** Gaps de schema documentados, incluido `purchase_entry.status` pendiente
- [x] **DASH** Tipado `SupplierDTO.contact` alineado
- [x] **DASH** Índices, `entry_id` y permisos cliente verificados
- [x] **AT** Política espejada

**Salida B0:** completa 2026-08-29.

## B1 — Proveedores

- [x] **DASH** Dominio/DTO/repo supplier
- [x] **DASH** Listar/crear/actualizar
- [x] **DASH** UI Proveedores
- [x] **DASH** Selector en factura de entrada
- [x] **DASH** Tests mapper
- [x] **AT** Cliente sin write de supplier verificado

## B2 — Historial y auditoría

- [x] **DASH** Listado de entradas con filtros
- [x] **DASH** Detalle + líneas + movements por `entry_id`
- [x] **DASH** Filtro por producto
- [x] **DASH** Movements de entrada llevan `entry_id`
- [x] **DASH** Tests listado/detalle

## B3 — Anulación / corrección de entradas

**DEP:** B2 + contrato stock (`existence`, `reserved`, `available`)

- [x] **BOTH** Política escrita: anulación compensatoria y regla `existence - qty >= reserved`
- [x] **BOTH** B3.0 auditoría del contrato real de stock completada
- [x] **DASH** Infraestructura de transacciones Appwrite Client SDK implementada
- [x] **DASH** `RegisterPurchaseEntryCaseUse` migrado a transacción Appwrite
- [x] **DASH** Fallo de movement ya no queda como soft-fail durante registro transaccional
- [x] **DASH** Caso de uso B3.1 `CancelPurchaseEntryCaseUse` implementado
- [x] **DASH** Reversión usa `ajuste` + `reason=purchase_entry_reversal` + `entry_id`
- [x] **DASH** Validación completa antes de mutar stock
- [x] **DASH** Idempotencia mediante `ACTIVE → CANCELLED` y conflicto transaccional
- [x] **DASH** `reserved` y `last_unit_cost` no se modifican durante reversión
- [ ] **DASH** Provisionar atributo Appwrite `purchase_entry.status` (`ACTIVE|CANCELLED`)
- [ ] **DASH** UI de anulación solo owner/admin + confirmación
- [ ] **DASH** Tests unitarios B3.1: `existence < reserved`, rollback e idempotencia
- [ ] **AT** Smoke operador `VERIFIED` post-anulación

**Estado B3:** núcleo transaccional implementado; habilitación final bloqueada por schema `status`, UI y tests/smoke.

### B3.2 — Corrección parcial

- [ ] **DASH** Diseñar ajuste parcial auditable
- [ ] **DASH** Implementar caso de uso
- [ ] **DASH** UI owner/admin
- [ ] **DASH** Tests

## B4 — Permisos, roles y smoke panel

- [x] **DASH** Permisos Appwrite auditados
- [x] **DASH** Smoke UI Proveedores → Entrada → Compras
- [x] **DASH** Smoke E2E proveedor → entrada → movements
- [x] **DASH** Badges/nav verificados
- [x] **AT** Cliente no escribe compras + operador confirma venta post-entrada

## B5 — Espejo AlejoTaller

- [x] **AT** Checklist espejo
- [x] **AT** COGS operador intacto
- [x] **AT** Cliente/MCP sin supplier/purchase
- [x] **AT** Política B3 espejada; no se añade lógica de anulación al cliente/operador

## B6 — Cierre y merge

- [ ] **DASH** CI verde en `Core3`
- [ ] **AT** CI módulos tocados verde
- [ ] **BOTH** PR `Core3` → `master`

### Criterio de merge

| Condición | ¿Merge? |
|---|---|
| B1+B2+B4 | Sí — release parcial |
| B3 completo | Sí — release completo |
| B3 núcleo sin schema/UI/tests | No |

## Registro

| Fecha | Nota |
|---|---|
| 2026-08-27 | Apertura Core3 + B0/B1/B2 inicial |
| 2026-08-28 | Schema/índices/permisos verificados; B2 completo |
| 2026-08-29 | B0 + B4 smoke E2E + B5 verificados |
| 2026-08-29 | B3.0: contrato real de stock auditado |
| 2026-08-29 | B3: Appwrite Client SDK transaction runner implementado; registro de entradas y anulación B3.1 preparados sobre la misma infraestructura. Pendiente schema `purchase_entry.status`, UI, tests y smoke. |
