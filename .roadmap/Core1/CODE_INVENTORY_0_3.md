# Tarea 0.3 — Inventario de código a tocar (Core 1 dash)

**Estado:** HECHO  
**Fecha:** 2026-08-09  
**Baseline commit de análisis:** tip `master` post-0.2  
**Contrato:** [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md)

Este inventario lista **archivos concretos** y el **cambio esperado** por fase de alineación. No implementa aún: solo el mapa de trabajo.

---

## Hallazgos críticos (baseline)

| Hallazgo | Evidencia |
|----------|-----------|
| Product **sin `reserved`** | `Product.ts`, `ProductDTO.ts`, `Mappers.ts` solo mapean `existence` |
| Dexie products sin reserved | `dexie.db.ts` v1/v2; DTO embebido en tabla |
| Verify de venta **solo** escribe `buy_state` | `SaleNetRepository.updateVerified` — **no** toca stock |
| Sale dominio **sin `currency`** | `Sale.ts` / `SaleDTO.ts` / mappers |
| Case use verify anémico | `UpdateSaleVerifiedCaseUse` = pass-through al repo |
| Create venta existe en net repo | `SaleNetRepository.create` — **no usar** para B2C en Core 1 panel |

---

## Mapa por fase de implementación

### Fase 1 — Modelo stock (`reserved` + `available`)

| Prioridad | Archivo | Qué tocar |
|-----------|---------|-----------|
| P0 | `src/core/feature/product/domain/entity/Product.ts` | Añadir `reserved: number`; helper `availableStock()` o export `available`; validar ≥ 0 |
| P0 | `src/core/feature/product/data/dto/ProductDTO.ts` | Campo `reserved?: number` (Appwrite) |
| P0 | `src/core/feature/product/data/mapper/Mappers.ts` | `productFromDTO` / `productToDTO` / `ProductWriteDTO`: mapear `reserved` (default 0 al leer si falta); **no** enviar reserved en updates de catálogo salvo tool documentada |
| P0 | `src/core/infrastructure/di/dexie.db.ts` | `version(3)`: mismos indexes; el DTO en tabla debe persistir `reserved` al hacer `bulkPut` |
| P1 | `src/core/feature/product/data/repository/product.offline-first.repository.ts` | Tras mapper, reserved remoto no se pierde; en `update` merge no forzar `reserved: 0` |
| P1 | `src/core/feature/product/data/repository/product.net.repository.ts` | Revisar payloads create/update (no borrar reserved remoto al actualizar solo precio/nombre) |
| P1 | `src/core/feature/product/domain/repository/product.repository.ts` | Tipos si hace falta |
| P1 | `src/core/feature/product/domain/caseuse/SaveProductCaseUse.ts` | Alta: `reserved = 0`; validar existence |
| P1 | `src/core/feature/product/domain/caseuse/UpdateProductPriceCaseUse.ts` | No tocar reserved |
| P2 | `src/core/feature/product/presentation/viewmodel/product.store.ts` | Exponer datos con available si la UI lo necesita |
| P2 | `src/core/feature/product/presentation/routes/ProductManagement.svelte` | UI: existence / reserved / available; reserved read-only |
| P2 | tests bajo `src/test/core/feature/product/` | Unit mapper + available |

**Nota create/update:** al hacer `productToDTO` en un update parcial de catálogo, preferir **omitir** `reserved` en el partial hacia Appwrite para no pisar holds activos, o re-leer reserved remoto y reenviarlo intacto.

---

### Fase 2 — Validaciones catálogo (warehouse panel)

| Prioridad | Archivo | Qué tocar |
|-----------|---------|-----------|
| P0 | `SaveProductCaseUse.ts` / create path | `existence >= 0`, `reserved = 0` |
| P0 | update de producto (case use o store + `ProductManagement.svelte`) | Guard: `existence >= reserved` |
| P1 | `ProductManagement.svelte` | Input reserved deshabilitado o oculto |
| P1 | `RoleConfig` + navegación | Solo admin/owner mutan (ver Fase 3) |

---

### Fase 3 — Auth staff / gates

| Prioridad | Archivo | Qué tocar |
|-----------|---------|-----------|
| P0 | `src/core/feature/auth/domain/config/RoleConfig.ts` | Ya define rutas; **verificar** uso real |
| P0 | `src/core/infrastructure/presentation/navigation/NestedNavigationWrapper.svelte` | Gates por rol + Unauthorized |
| P1 | `src/core/feature/auth/presentation/routes/UserManagement.svelte` | `canManageRole` en UI |
| P1 | `src/core/feature/auth/presentation/viewmodel/user-management.store.ts` | Idem backend/function |
| P2 | `src/core/feature/auth/domain/caseuse/*ManagedUser*` | Labels Appwrite |
| P2 | Login/Splash staff | Sin guest tienda |

---

### Fase 4 — Ventas lectura + currency

| Prioridad | Archivo | Qué tocar |
|-----------|---------|-----------|
| P0 | `src/core/feature/sale/domain/entity/Sale.ts` | Campo `currency?: string` (o enum alineado a clientes) |
| P0 | `src/core/feature/sale/data/dto/SaleDTO.ts` | `currency` desde Appwrite |
| P0 | `src/core/feature/sale/data/mapper/Mappers.ts` | Mapear currency |
| P1 | `src/core/feature/sale/presentation/routes/SaleDetail.svelte` | Mostrar currency + amount |
| P1 | `src/core/feature/sale/presentation/routes/SaleManagement.svelte` | Filtros UNVERIFIED / VERIFIED / DELETED |
| P2 | `src/core/infrastructure/presentation/routes/ReservationManagement.svelte` | Coherencia estados si aplica |
| P2 | `sale.store.ts` | Selectores por `verified` |

---

### Fase 5 — Ventas escritura stock (confirm / reject)

| Prioridad | Archivo | Qué tocar |
|-----------|---------|-----------|
| P0 | **Nuevo** case use p.ej. `ConfirmSaleFromPanelCaseUse` / `RejectSaleFromPanelCaseUse` | Orquestar: re-read sale + products → mutar stock → `buy_state` → idempotencia |
| P0 | `product.net.repository.ts` | Métodos atómicos si el SDK lo permite (`incrementDocumentAttribute`) o update controlado existence/reserved |
| P0 | `sale.net.repository.ts` | `updateVerified` puede quedar; el **stock no** vive solo ahí |
| P0 | `UpdateSaleVerifiedCaseUse.ts` | Deprecar uso UI directo **o** ampliar para no usarse sin stock |
| P1 | `sale.offline-first.repository.ts` | Sync post-mutación |
| P1 | `sale.container.ts` | Registrar nuevos use cases |
| P1 | `sale.store.ts` → `setVerified` | Llamar confirm/reject con stock, no solo string |
| P1 | `SaleDetail.svelte` / `SaleManagement.svelte` | Confirm dialog; botones según estado |
| P2 | (Opcional) pulse/RT | Core 1 no obliga; clientes ya refrescan |

**Semántica obligatoria (freeze):**

- Confirm → `existence -= qty`, `reserved -= qty` por línea  
- Reject → solo `reserved -= qty`  
- Idempotente si ya VERIFIED/DELETED  

---

### Fase 6 — Coherencia / no segundo hold

| Prioridad | Archivo | Qué tocar |
|-----------|---------|-----------|
| P0 | Cualquier UI “nueva venta” en dash | **Eliminar o bloquear** en Core 1 |
| P1 | `SaleNetRepository.create` | No exponer desde panel B2C |
| P1 | Tras save producto | Asegurar Appwrite es fuente; store re-sync |

---

## Archivos de soporte (tocar poco o nada en Core 1)

| Archivo | Nota |
|---------|------|
| `src/core/feature/category/**` | Solo si validación borra categoría con productos |
| `src/core/feature/support/**` | Fuera del soft-hold; no bloquea Core 1 stock |
| `src/core/feature/notification/**` | Promos; fuera del cierre stock |
| `workers/**`, `services/**` | Secretos server; ya cubierto por 0.2 |
| `src/core/infrastructure/presentation/components/InfraStatusPanel.svelte` | No stock |

---

## Orden de implementación recomendado (post-0.3)

```text
1.x  Product entity + DTO + mapper + Dexie v3
2.x  Validaciones save + UI ProductManagement
3.x  Gates NestedNavigation + UserManagement (puede paralelizarse)
4.x  Sale currency + filtros listado
5.x  Confirm/Reject con stock (el bloque más delicado)
6.x  Smoke: pedido tienda → dash confirm/reject → Appwrite
```

---

## Checklist aceptación 0.3

- [x] Inventario publicado en repo
- [x] Gaps críticos documentados (reserved, verify sin stock, currency)
- [x] Archivos mapeados a fases 1–6
- [x] Status Core1 actualizado

**Siguiente:** Fase **1.1** — `reserved` en dominio `Product`.
