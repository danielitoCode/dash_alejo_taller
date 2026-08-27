# Core 3 — Checklist unificado (dash + AlejoTaller)

**Última actualización:** 2026-08-27  
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
- [ ] **DASH** Verificación manual consola: índices purchase_entry + `stock_movements.entry_id` + permisos cliente
- [ ] **AT** Espejar política en `.roadmap/Core3/` (cuando se trabaje B0 en monorepo)

**Salida B0:** política aceptada + gaps de schema listados + tipos supplier alineados a Appwrite real.

---

## B1 — Proveedores (DASH primario)

**DEP:** B0 (docs + tipos)

- [ ] **DASH** Dominio/DTO/repo `supplier` (CRUD) — repo net ya existe; falta UI y case uses de listado/edición dedicados
- [ ] **DASH** Case uses: listar, crear, actualizar, (soft) desactivar
- [ ] **DASH** UI: pantalla o sección **Proveedores** en nav staff
- [ ] **DASH** Integrar selector de proveedor en flujo existente **Registrar entrada** (buscar + crear rápido)
- [ ] **DASH** Tests unitarios mapper/repo supplier
- [ ] **AT** Ninguna UI; verificar permisos Appwrite: cliente **sin** write de supplier

**Salida B1:** staff puede mantener proveedores y usarlos al registrar entrada.

---

## B2 — Historial y auditoría de compras (DASH)

**DEP:** B1 (proveedor resoluble en listados)

- [ ] **DASH** Listado facturas de entrada: filtros fecha, proveedor, referencia, usuario
- [ ] **DASH** Detalle de entrada: cabecera + líneas + link a `stock_movements` (`entry_id`)
- [ ] **DASH** Vista por producto: entradas que afectaron ese SKU (costos históricos)
- [ ] **DASH** Garantizar que cada `entrada` de movement lleve `entry_id` cuando viene de factura
- [ ] **DASH** Tests de listado/detalle (unit o integración ligera)
- [ ] **AT** No aplica UI; opcional: test/lectura que `last_unit_cost` en product sigue siendo la fuente de COGS operador

**Salida B2:** cualquier entrada Core 2/3 es consultable y trazable.

---

## B3 — Anulación / corrección de entradas (DASH · delicado)

**DEP:** B2 + contrato stock Core 2 (`existence`, `reserved`, `available`)

- [ ] **BOTH** Política escrita: anular crea movements compensatorios; **no** si `existence - qty < reserved`
- [ ] **DASH** Case use anular/corregir + `status` en schema si se adopta
- [ ] **DASH** UI: acción anular/corregir solo roles owner/admin
- [ ] **DASH** Tests: no permite dejar `existence < reserved`; idempotencia de anulación
- [ ] **AT** **DEP B3 dash:** smoke operador confirm VERIFIED tras anulación

**Salida B3:** correcciones auditables sin romper soft-hold.

---

## B4 — Permisos, roles y smoke panel (DASH)

**DEP:** B1–B2 obligatorios; B3 si entra en el mismo release

- [ ] **DASH** Permisos Appwrite auditados en consola
- [ ] **DASH** Smoke manual: proveedor → entrada multi-línea → historial → (opcional) anulación
- [ ] **DASH** Verificar badges/nav no se rompen
- [ ] **AT** Smoke: login cliente no escribe compras; operador confirma venta post-entrada

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
