# Core 3 — B4 Smoke (permisos + panel + frontera)

**Fecha:** 2026-08-27  
**Rama:** `Core3`  
**Objetivo:** validar que B1+B2 funcionan de punta a punta con datos reales y que los permisos no se escapan al cliente.

Marca cada casilla al completar. Cuando todo esté OK, actualizar `CORE3_UNIFIED_CHECKLIST.md` y `MVP_CORE3_STATUS.md`.

---

## A. Consola Appwrite (permisos e índices)

### Collections a revisar
`supplier`, `purchase_entry`, `purchase_entry_line`, `stock_movements`, `product`

### A1 — Atributos críticos
- [ ] `supplier`: `name` required, `contact` required, `notes` optional
- [ ] `purchase_entry`: `entry_date`, `total_cost`, `currency`, `user_id`, `line_count` presentes
- [ ] `stock_movements`: atributo **`entry_id`** (string, optional) existe
- [ ] `product`: **`last_unit_cost`** existe (number/float)

### A2 — Índices (recomendados; si falta alguno, listado puede fallar o ir lento)
- [ ] `purchase_entry`: order por `entry_date` (desc)
- [ ] `purchase_entry`: equal `supplier_id` (si filtras por proveedor en servidor)
- [ ] `purchase_entry_line`: equal `entry_id`
- [ ] `stock_movements`: equal `entry_id`

### A3 — Permisos (regla de oro Core 3)

| Actor | supplier | purchase_* | stock_movements |
|-------|----------|------------|-----------------|
| Cliente B2C | **sin write** | **sin write** | **sin write** |
| Staff dash (API key / sesión staff) | read+write según rol | create+read | create (entrada) |

- [ ] Rol/colección: usuarios **cliente** no pueden `create`/`update` en `supplier`
- [ ] Cliente no puede `create` en `purchase_entry` ni `purchase_entry_line`
- [ ] Cliente no puede `create` en `stock_movements` (salvo diseño legacy; ideal: no)

> Si los permisos son “any authenticated”, documentar el riesgo y planear endurecer en B4/B5.

---

## B. Smoke panel dash (owner o admin)

### B1 — Nav y roles (entrada al panel)
Staff que **entra** al dashboard: **owner**, **admin**, **sales** (label Appwrite `operator` = sales).
**Viewer / cliente B2C** → unauthorized (no entra).

| Rol | Entra al panel | Proveedores / Compras | Productos / Inventario / Users | Ventas / Reservas / Mensajes |
|-----|----------------|------------------------|--------------------------------|------------------------------|
| owner / admin | sí | sí | sí | sí |
| sales / operator | sí | no | no | sí |
| viewer / cliente | no | — | — | — |

- [ ] Login **owner** o **admin**: menú con **Proveedores** y **Compras**
- [ ] Login **sales** o label **operator**: entra; **no** ve Proveedores ni Compras; sí Ventas/Reservas/Mensajes
- [ ] Login **viewer**/cliente: pantalla unauthorized
- [ ] Badges de Ventas / Mensajes / Reservas siguen mostrando conteos (no se rompen)

### B2 — Proveedores
- [ ] Abrir **Proveedores** → lista carga (o vacío con mensaje claro)
- [ ] Alta manual opcional: nombre + contacto → aparece en listado
- [ ] Editar un proveedor → Guardar → cambios visibles al refrescar/listar

### B3 — Factura de entrada (flujo E2E de datos)
Preparar: 1 producto existente con stock conocido (anotar `existence` y `last_unit_cost`).

1. **Productos** → **Factura de entrada** (o el CTA que abras el modal)
2. Proveedor: **+ Nuevo proveedor…** con nombre (y contacto opcional) **o** uno existente
3. Al menos **2 líneas**:
   - Línea A: producto catálogo, qty > 0, unit cost > 0, concept `purchase`
   - Línea B: otro producto o la misma, qty > 0
4. Registrar factura → toast de éxito

Comprobar después:
- [ ] Producto(s): `existence` subió en la cantidad comprada
- [ ] Si concept `purchase` y unit cost > 0: `last_unit_cost` del producto = ese costo
- [ ] **Compras**: aparece la entrada nueva (referencia o id)
- [ ] Click en la fila → **detalle**: cabecera correcta (proveedor, total, líneas)
- [ ] En detalle, sección **Movements**: hay filas `entrada` con qty y `entry_id` ligado (no vacío)

### B4 — Filtros historial
- [ ] Filtro por proveedor muestra solo esa entrada
- [ ] Filtro por texto (referencia / id) encuentra la factura
- [ ] Rango de fechas coherente (desde/hasta)

### B5 — Regresión nav
- [ ] Ir a Ventas, Productos, Inventario y volver a Compras sin errores de consola
- [ ] Logout / login de nuevo: rutas y sesión OK

---

## C. Smoke frontera AlejoTaller (si puedes en paralelo)

- [ ] App/web **cliente**: no hay pantalla de proveedores ni historial de compras del panel
- [ ] MCP / tools: no hay tool de create supplier / purchase_entry
- [ ] (Ideal) Tras la entrada del paso B3, en **operador**: confirmar una venta VERIFIED → se escribe `salida_venta` y finance; stock no queda `existence < reserved`

---

## Resultado

| Área | OK / Fallo | Notas |
|------|------------|-------|
| A Consola | | |
| B Panel E2E | | |
| C Frontera AT | | |

**B4 se considera cerrado** cuando A3 + B1 + B3 están en OK.  
Ítems de índice (A2) y C pueden quedar como “seguimiento” si no bloquean el merge parcial, pero hay que documentarlos.
