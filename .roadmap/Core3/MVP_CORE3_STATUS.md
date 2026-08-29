# MVP Core 3 — Estado vivo (dash)

**Última actualización:** 2026-08-29  
**Rama:** `Core3`  
**Core 3 cerrado:** **NO**

| Bloque | Estado |
|--------|--------|
| B0 Baseline / política / audit schema / consola | **Cerrado** |
| B1 Proveedores UI + selector en factura | **Hecho + smoke UI OK** |
| B2 Historial compras (listado → detalle + filtro producto) | **Hecho + smoke UI OK** |
| B3.1 Anulación completa | **Código completo:** núcleo + schema `status` + UI anular (owner/admin + confirmación). Falta smoke operador post-anulación |
| B3.2 Corrección parcial | pendiente (no bloquea B3.1) |
| B4 Permisos + smoke panel | **Hecho (dash).** AT smoke cruzado: verificar lista en espejo AT |
| B5 Espejo AT | código frontera OK; STATUS AT alineado; smokes AT por confirmar |
| B6 Merge master | no — falta CI en GitHub Actions + smokes + PR |

### Smoke UI (2026-08-27)

| Flujo | Resultado |
|-------|-----------|
| Subvista **Proveedores** | OK |
| Alta proveedor desde **factura de entrada** | OK |
| Subvista **Compras** listado → detalle | OK |

### B3.1

- `CancelPurchaseEntryCaseUse` + transacciones Appwrite
- Tests unitarios (reserved, idempotencia, movimiento compensatorio)
- Consola: `purchase_entry.status` = `ACTIVE` \| `CANCELLED` (**2026-08-29**)
- Botón "Anular entrada" en detalle de Compras (owner/admin, con `window.confirm` describiendo consecuencias); badge de estado "Anulada" en detalle y listado (**2026-08-29**)
- Pendiente: smoke manual (anular una entrada de prueba, confirmar `existence`/`reserved`/`last_unit_cost` y bloqueo si `existence < reserved`)

### Fix CI (2026-08-29)

- `tsconfig.app.json`: faltaba `"node"` en `compilerOptions.types` → `svelte-check` no resolvía `process.env` en `b3.1.appwrite.integration.test.ts` y `vitest.setup.ts` (`@types/node` ya era dependencia).
- `console.interceptor.ts`: al agregar los tipos de Node, el `Console` global chocaba con la reasignación dinámica de `console[level]`; se tipó explícitamente vía `unknown` intermedio.
- Verificado localmente: `svelte-check` 0 errores, `tsc -p tsconfig.node.json` 0 errores, `vitest run --project unit --project integration --project ui` → 173/175 (2 fallos preexistentes en `SupportInbox.ui.test.ts`, no relacionados a Core3, reproducidos también sin este cambio).

### Siguiente para cerrar Core 3

1. Smoke manual de anulación en Compras (owner/admin)  
2. Confirmar CI verde en GitHub Actions (`Core3`)  
3. Smokes AT (lista en espejo)  
4. PR `Core3` → `master`  
