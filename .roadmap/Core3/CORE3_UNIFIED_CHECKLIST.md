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

- [ ] **BOTH** Confirmar Core 2 en `master` (factura entrada + `salida_venta` + finance) sin regresiones
- [ ] **BOTH** Documentar política de compras Core 3: proveedores, inmutabilidad vs anulación, quién escribe
- [ ] **DASH** Auditar schema Appwrite real vs `APPWRITE_CORE2_SCHEMA` (`supplier`, `purchase_entry`, `purchase_entry_line`, `entry_id` en movements)
- [ ] **DASH** Listar gaps de atributos (p. ej. `active` en supplier, `status` en purchase_entry si se anula)
- [ ] **AT** Espejar política en `.roadmap/Core3/` y `.policies/` si aplica (sin código de UI compras)

**Salida B0:** política aceptada + gaps de schema listados. Sin esto no hay B3 (anulación).

---

## B1 — Proveedores (DASH primario)

**DEP:** B0

- [ ] **DASH** Dominio/DTO/repo `supplier` (CRUD)
- [ ] **DASH** Case uses: listar, crear, actualizar, (soft) desactivar
- [ ] **DASH** UI: pantalla o sección **Proveedores** en nav staff
- [ ] **DASH** Integrar selector de proveedor en flujo existente **Registrar entrada** (buscar + crear rápido)
- [ ] **DASH** Tests unitarios mapper/repo supplier
- [ ] **AT** Ninguna UI; verificar permisos Appwrite: cliente **sin** write/read sensible de supplier si no aplica

**Salida B1:** staff puede mantener proveedores y usarlos al registrar entrada.

---

## B2 — Historial y auditoría de compras (DASH)

**DEP:** B1 (proveedor resoluble en listados)

- [ ] **DASH** Listado facturas de entrada: filtros fecha, proveedor, referencia, usuario
- [ ] **DASH** Detalle de entrada: cabecera + líneas + link a `stock_movements` (`entry_id`)
- [ ] **DASH** Vista por producto: entradas que afectaron ese SKU (costos históricos)
- [ ] **DASH** Garantizar que cada `entrada` de movement lleve `entry_id` cuando viene de factura (backfill opcional solo docs/manual)
- [ ] **DASH** Tests de listado/detalle (unit o integración ligera)
- [ ] **AT** No aplica UI; opcional: test/lectura que `last_unit_cost` en product sigue siendo la fuente de COGS operador

**Salida B2:** cualquier entrada Core 2/3 es consultable y trazable.

---

## B3 — Anulación / corrección de entradas (DASH · delicado)

**DEP:** B2 + contrato stock Core 2 (`existence`, `reserved`, `available`)

- [ ] **BOTH** Política escrita: ¿anular crea movements compensatorios? ¿se permite si `existence - qty < reserved`? (respuesta esperada: **no**)
- [ ] **DASH** Case use anular/corregir: valida `existence >= reserved` tras el efecto; escribe traza (movement tipo acordado o `ajuste` documentado + estado en `purchase_entry`)
- [ ] **DASH** UI: acción anular/corregir solo roles owner/admin
- [ ] **DASH** Tests: no permite dejar `existence < reserved`; idempotencia de anulación
- [ ] **AT** **DEP B3 dash:** tras merge o API estable, smoke operador: confirm VERIFIED sigue OK; no requiere feature nueva si solo lee `last_unit_cost`

**Salida B3:** correcciones auditables sin romper soft-hold.

---

## B4 — Permisos, roles y smoke panel (DASH)

**DEP:** B1–B3 (al menos B1–B2 obligatorios; B3 si se implementa en el mismo release)

- [ ] **DASH** Permisos Appwrite: cliente sin write `supplier` / `purchase_*`; viewer solo lectura; sales/admin según política
- [ ] **DASH** Smoke manual: proveedor → entrada multi-línea → historial → (opcional) anulación
- [ ] **DASH** Verificar badges/nav no se rompen
- [ ] **AT** Smoke: login cliente no ve ni escribe compras; operador confirma venta de prueba post-entrada

**Salida B4:** superficie segura y usable en panel.

---

## B5 — Espejo AlejoTaller (AT · no bloquea UI dash)

**DEP:** B0 (puede avanzar en paralelo a B1–B2); **DEP B3** solo si hay cambio de contrato de costos

- [ ] **AT** Actualizar `.roadmap/Core3/` checklist espejo (este archivo es canónico de orden; AT marca su columna)
- [ ] **AT** Confirmar operador: COGS = `last_unit_cost × qty` tras nuevas entradas dash
- [ ] **AT** Confirmar web/Android cliente: sin tools/UI de supplier/purchase
- [ ] **AT** MCP: sin tools de abastecimiento (sigue B2C)
- [ ] **AT** Docs README / roadmap: Core 3 en curso en rama `Core3`

**Salida B5:** monorepo no regresa y no expone compras a B2C.

---

## B6 — Cierre y merge

**DEP:** B1 + B2 + B4 obligatorios; B3 si entró en alcance del release; B5 verificado

- [ ] **DASH** CI verde en rama `Core3`
- [ ] **AT** CI relevante verde (al menos módulos tocados)
- [ ] **BOTH** Checklist marcado; README Core3 estado → listo merge
- [ ] **DASH** PR `Core3` → `master` (panel)
- [ ] **AT** PR `Core3` → `master` (solo si hubo cambios de código/docs; si solo docs, PR docs)
- [ ] **BOTH** Post-merge: smoke producción/staging una entrada real

### Criterio explícito de “merge disponible”

| Condición | ¿Merge? |
|-----------|---------|
| Solo B0 docs | No |
| B1+B2+B4 sin B3 | **Sí** (release parcial Compras lectura+proveedores) |
| B1–B4 con B3 | **Sí** (release completo abastecimiento) |
| B3 a medias (compensación stock incompleta) | **No** |

---

## Opcional (no bloquea cierre)

- [ ] **DASH** Alerta stock bajo / sugerencia reorden por proveedor habitual
- [ ] **DASH** Export CSV de entradas por periodo
- [ ] **DASH** Multi-moneda con tipo de cambio (mejor Core futuro)
- [ ] **BOTH** FIFO por lote (explícitamente fuera)

---

## Diagrama de dependencias

```text
                    ┌─────────────┐
                    │ B0 Política │
                    │ schema BOTH │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            │            ▼
        ┌──────────┐       │      ┌────────────┐
        │ B1 Suppl │       │      │ B5 AT docs │
        │  DASH    │       │      │ paralelo   │
        └────┬─────┘       │      └─────▲──────┘
             ▼             │            │
        ┌──────────┐       │            │
        │ B2 Hist. │───────┼────────────┘
        │  DASH    │       │
        └────┬─────┘       │
             ▼             │
        ┌──────────┐       │
        │ B3 Anula │ (opcional en 1er release)
        │  DASH    │
        └────┬─────┘
             ▼
        ┌──────────┐
        │ B4 Smoke │
        │ permisos │
        └────┬─────┘
             ▼
        ┌──────────┐
        │ B6 Merge │
        └──────────┘
```

---

| Fecha | Nota |
|-------|------|
| 2026-08-27 | Apertura rama `Core3` + checklist inicial |
