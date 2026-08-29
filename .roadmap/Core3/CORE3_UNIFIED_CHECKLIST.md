# Core 3 — Checklist unificado (dash + AlejoTaller)

**Última actualización:** 2026-08-29  
**Rama:** `Core3` en ambos repos.

## B0 — Baseline y política

- [x] **BOTH** Core 2 confirmado sin regresiones
- [x] **DASH** Política de compras Core 3 documentada
- [x] **DASH** Schema auditado
- [x] **DASH** Gaps de schema documentados (`purchase_entry.status` provisionado 2026-08-29)
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
- [x] **DASH** Atributo Appwrite `purchase_entry.status` (`ACTIVE|CANCELLED`) provisionado (consola 2026-08-29)
- [x] **DASH** UI de anulación solo owner/admin + confirmación
- [x] **DASH** Tests unitarios B3.1: `existence < reserved`, rollback de dominio e idempotencia
- [ ] **AT** Smoke operador `VERIFIED` post-anulación (**DEP** UI B3 dash — UI ya lista; falta correr el smoke)

**Estado B3:** núcleo + schema `status` + UI de anulación listos (código). Falta smoke operador post-anulación y confirmar CI verde en GitHub.

### B3.2 — Corrección parcial

- [ ] **DASH** Diseñar ajuste parcial auditable
- [ ] **DASH** Implementar caso de uso
- [ ] **DASH** UI owner/admin
- [ ] **DASH** Tests

*(Opcional; no bloquea cierre de B3.1 / Core 3 mínimo con anulación completa.)*

## B4 — Permisos, roles y smoke panel

- [x] **DASH** Permisos Appwrite auditados
- [x] **DASH** Smoke UI Proveedores → Entrada → Compras
- [x] **DASH** Smoke E2E proveedor → entrada → movements
- [x] **DASH** Badges/nav verificados
- [x] **DASH** Gate panel: owner/admin + sales/operator; compras/proveedores solo owner/admin
- [ ] **AT** Smoke cruzado — ver lista de verificación en el espejo AT (código OK; falta confirmación manual)

## B5 — Espejo AlejoTaller

- [x] **AT** Checklist espejo (carpeta `.roadmap/Core3/`)
- [x] **AT** COGS operador intacto en código (`last_unit_cost × qty` al VERIFIED)
- [ ] **AT** (opcional) Test/nota nueva Core3 de lectura `last_unit_cost` en COGS — **se mantiene pendiente**
- [x] **AT** Cliente/MCP sin supplier/purchase (código)
- [x] **AT** Política B3 espejada; no se añade lógica de anulación al cliente/operador
- [ ] **AT** Confirmar smokes B4/B5 en dispositivo/web (lista en espejo AT)

## B6 — Cierre y merge

- [ ] **DASH** CI verde en `Core3` (verificado localmente: `svelte-check` 0 errores, `tsc -p tsconfig.node.json` 0 errores, `vitest` unit+integration+ui 173/175 — 2 fallos preexistentes en `SupportInbox.ui.test.ts` no relacionados; falta confirmar el run real en GitHub Actions)
- [ ] **AT** CI módulos tocados verde
- [ ] **BOTH** PR `Core3` → `master`

### Criterio de merge

| Condición | ¿Merge? |
|---|---|
| B1+B2+B4 | Sí — release parcial (sin anulación en UI) |
| B3.1 (schema + UI + CI) | Sí — release con anulación completa |
| B3.2 | No bloquea |

## Registro

| Fecha | Nota |
|---|---|
| 2026-08-27 | Apertura Core3 + B0/B1/B2 inicial |
| 2026-08-28 | Schema/índices/permisos verificados; B2 completo |
| 2026-08-29 | B0 + B4 smoke E2E panel; B3.0 stock audit; B3.1 transaccional |
| 2026-08-29 | Consola: `purchase_entry.status` ACTIVE\|CANCELLED provisionado |
| 2026-08-29 | UI anulación (owner/admin + confirmación) implementada; fix CI `process.env` (tsconfig `types`) |
