# Core 3 — Checklist unificado (dash + AlejoTaller)

**Última actualización:** 2026-08-28  
**Rama de trabajo:** `Core3` en ambos repos  
**Trabajo centralizado:** seguir este archivo + el espejo en AlejoTaller; marcar `[x]` solo tras verificar.

**Leyenda de ownership**

| Tag | Significado |
|-----|------------|
| **DASH** | Implementar en `dash_alejo_taller` |
| **AT** | Implementar en `AlejoTaller` |
| **BOTH** | Docs/política en ambos; o verificación cruzada |
| **DEP** | No empezar hasta que el ítem citado esté hecho |

---

## B0 — Baseline y política (primero)

- [x] **BOTH** Confirmar Core 2 en `master` (factura entrada + `salida_venta` + finance) sin regresiones
- [x] **DASH** Documentar política de compras Core 3 → [`POLICY_PURCHASE_CORE3.md`](./POLICY_PURCHASE_CORE3.md)
- [x] **DASH** Auditar schema Appwrite vs código → [`SCHEMA_AUDIT_CORE3.md`](./SCHEMA_AUDIT_CORE3.md)
- [x] **DASH** Gaps listados: `contact` required real; sin `active` supplier; sin `status` entry (B3); verificar `entry_id` en movements
- [x] **DASH** Tipado: `SupplierDTO.contact: string` + write path siempre envía `contact`
- [x] **DASH** Verificación manual consola: índices `purchase_entry` + `stock_movements.entry_id` + permisos cliente
- [ ] **AT** Espejar política en `.roadmap/Core3/` (cuando se trabaje B0 en monorepo)

**Salida B0:** política aceptada + gaps de schema listados + tipos supplier alineados a Appwrite real + consola verificada.  
**2026-08-28:** B0 dash **cerrado** (política, audit, tipado, consola índices/entry_id/permisos). Resta espejo AT.

---

## B1 — Proveedores (DASH primario)

**DEP:** B0 (docs + tipos)

- [x] **DASH** Dominio/DTO/repo `supplier` (CRUD) — case uses list/create/update + net repo
- [x] **DASH** Case uses: listar, crear, actualizar (**sin** borrado; fuera de alcance)
- [x] **DASH** UI: pantalla **Proveedores** en nav (`suppliers`, owner/admin) — **smoke OK 2026-08-27**
- [x] **DASH** Integrar selector de proveedor en **factura de entrada** (existente | sin proveedor | **+ Nuevo proveedor…**) — **smoke OK 2026-08-27**
- [x] **DASH** Tests unitarios mapper supplier
- [ ] **AT** Ninguna UI; verificar permisos Appwrite: cliente **sin** write de supplier

**Salida B1:** staff puede mantener proveedores y usarlos / crearlos al registrar entrada. ✅ (dash)

---

## B2 — Historial y auditoría de compras (DASH)

**DEP:** B1 (proveedor resoluble en listados)

- [x] **DASH** Listado facturas de entrada: filtros fecha, proveedor, referencia/usuario/texto — ruta **Compras** (`purchases`) — **smoke OK 2026-08-27**
- [x] **DASH** Detalle de entrada: cabecera + líneas + movements por `entry_id` (click en fila) — **smoke OK 2026-08-27**
- [x] **DASH** Vista por producto: filtro producto en historial vía `listLinesByProduct` + UI en `PurchaseHistory.svelte`
- [x] **DASH** Cada `entrada` de movement desde factura lleva `entry_id` (RegisterPurchaseEntryCaseUse + detalle `listByEntry`)
- [x] **DASH** Tests de listado/detalle (`filterPurchaseEntries`, GetPurchaseEntryDetail)
- [ ] **AT** No aplica UI; opcional: test/lectura que `last_unit_cost` en product sigue siendo la fuente de COGS operador

**Salida B2:** cualquier entrada Core 2/3 es consultable y trazable. ✅ listado + detalle + filtro producto (dash)

**Código verificado 2026-08-28:** `PurchaseHistory.svelte`, `ListPurchaseEntriesCaseUse`, `GetPurchaseEntryDetailCaseUse`, `filterPurchaseEntries`, `listByEntry(entry_id)`, `listLinesByProduct`.

---

## B3 — Anulación / corrección de entradas (DASH · delicado)

**DEP:** B2 + contrato stock Core 2 (`existence`, `reserved`, `available`)

- [ ] **BOTH** Política escrita: anular crea movements compensatorios; **no** si `existence - qty < reserved`
- [ ] **DASH** Case use anular/corregir + `status` en schema si se adopta
- [ ] **DASH** UI: acción anular/corregir solo roles owner/admin
- [ ] **DASH** Tests: no permite dejar `existence < reserved`; idempotencia de anulación
- [ ] **AT** **DEP B3 dash:** smoke operador confirm VERIFIED tras anulación

**Salida B3:** correcciones auditables sin romper soft-hold. *(opcional 1er release)*

---

## B4 — Permisos, roles y smoke panel (DASH)

**DEP:** B1–B2 obligatorios; B3 si entra en el mismo release

- [x] **DASH** Permisos Appwrite auditados en consola (cliente sin write supplier / purchase_* / stock_movements) — verificado B0 2026-08-28
- [x] **DASH** Smoke manual UI: subvista Proveedores + alta en factura + subvista Compras listado → detalle — **OK 2026-08-27**
- [ ] **DASH** Smoke end-to-end datos: proveedor → entrada multi-línea → movements visibles en detalle (validar en prod/staging)
- [ ] **DASH** Verificar badges/nav no se rompen
- [ ] **AT** Smoke: login cliente no escribe compras; operador confirma venta post-entrada

**2026-08-28:** B4 en curso. Ejecutar checklist restante en [`SMOKE_B4.md`](./SMOKE_B4.md).

---

## B5 — Espejo AlejoTaller (AT)

**DEP:** B0; **DEP B3** solo si cambia contrato de costos

- [ ] **AT** Checklist espejo marcado
- [ ] **AT** COGS operador intacto
- [ ] **AT** Cliente/MCP sin supplier/purchase

---

## B6 — Cierre y merge

**DEP:** B1 + B2 + B4; B3 si aplica

- [ ] **DASH** CI verde en `Core3`
- [ ] **AT** CI módulos tocados verde
- [ ] **BOTH** PR `Core3` → `master` bajo criterio de release parcial o completo

### Criterio de merge

| Condición | ¿Merge? |
|-----------|---------|
| Solo B0 | No (docs en rama hasta tener B1+ o merge docs aislado) |
| B1+B2+B4 | Sí — release parcial |
| B1–B4 con B3 | Sí — release completo |
| B3 a medias | No |

---

## Opcional (no bloquea)

- [ ] **DASH** Alerta stock bajo / reorden
- [ ] **DASH** Export CSV entradas
- [ ] **BOTH** FIFO por lote (fuera)

---

| Fecha | Nota |
|-------|------|
| 2026-08-27 | Apertura rama `Core3` + checklist inicial |
| 2026-08-27 | **B0 dash:** política, audit schema, tipado `contact` |
| 2026-08-27 | **B1+B2 smoke UI:** Proveedores, alta en factura, Compras listado→detalle |
| 2026-08-28 | **B0 consola** índices/`entry_id`/permisos cliente marcados verificados. **B2** completo incl. filtro producto en código |
