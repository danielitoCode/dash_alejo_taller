# Core 2 — Plan de implementación por fases (checklist)

**Última actualización:** 2026-08-13  
**Estado del plan:** publicado · ejecución **0%** · **finanzas (factura de entrada + margen)** incluidas  
**Repos:** dash_alejo_taller + AlejoTaller (schema / operador)

Marca `[x]` al completar. No avanzar de fase crítica de stock sin regresión verde del QA Core 1 (15 min).

**Fórmula canónica (congelada):** `available = max(0, existence − reserved)`

---

## Registro de avance

```text
Inicio plan: 2026-08-12
Ejecutor: ____________________
Fase actual: 2.0 (decisiones producto cerradas → listo para 2.1)
Core 2 cerrado: NO
```

---

## Fase 2.0 — Alcance y políticas delta

**Objetivo:** congelar alcance MVP y documentar deltas de política antes de schema.

- [x] Documentar plan por fases (este archivo)
- [x] README + STATUS + POLICY_DELTAS en `.roadmap/Core2/`
- [x] Modelo financiero propuesto ([`FINANCE_MODEL_CORE2.md`](./FINANCE_MODEL_CORE2.md))
- [x] **Aceptar** modelo financiero (factura de entrada + ingreso/COGS al VERIFIED) — 2026-08-13
- [x] Decisión producto: **Reservas de taller** dentro del MVP Core 2 — **SÍ**
- [ ] Revisar y aceptar [`POLICY_DELTAS_CORE2.md`](./POLICY_DELTAS_CORE2.md) en ambos repos (espejo AlejoTaller pendiente)
- [ ] Espejo mínimo de alcance en `AlejoTaller/.roadmap/Core2/` (enlace o copia de fases)
- [x] Valoración de costo al vender: **último costo** (`last_unit_cost`) — no promedio (evita distorsión/pérdidas ficticias)

**Criterio de salida 2.0:** alcance firmado + políticas delta + modelo financiero aceptados.

---

## Fase 2.1 — Schema stock + finanzas (AlejoTaller / Appwrite)

**Objetivo:** collections de movimientos y de entrada económica listas para operador y dash.

### Movimientos de stock
- [ ] Collection `stock_movements` creada en Appwrite (staging)
- [ ] Campos: `product_id`, `type`, `quantity`, `balance_after`, `reason`, `user_id`, `sale_id?`, `created_at`
- [ ] Enum `type`: `entrada` | `salida_venta` | `ajuste` | `devolucion`
- [ ] Permisos: lectura staff/operador; escritura staff/operador (no cliente)

### Finanzas de entrada
- [ ] Collection `supplier` (name, contact?, notes?)
- [ ] Collection `purchase_entry` (cabecera: supplier_id?, reference?, entry_date, total_cost, currency, user_id, notes?)
- [ ] Collection `purchase_entry_line` (entry_id, product_id, quantity, unit_cost, concept, line_cost)
- [ ] Enum concepto línea: `purchase` | `royalty` | `other`

### Finanzas de venta (al confirmar)
- [ ] Collection `sale_finance_event` **o** campos acordados en confirmación (`sale_id`, `revenue`, `cogs`, `margin`, `user_id`, `at`)
- [ ] Campo producto `last_unit_cost` (base COGS)
- [ ] DTO + repo / contrato documentado para dash
- [ ] Documento de schema enlazado desde este plan ([`FINANCE_MODEL_CORE2.md`](./FINANCE_MODEL_CORE2.md))

**Criterio de salida 2.1:** movimiento de prueba + cabecera/línea de entrada de prueba creados por API con totales coherentes.

---

## Fase 2.2 — Operador / confirmación: traza stock + finanzas (AlejoTaller)

**Objetivo:** al confirmar venta, soft-hold Core 1 + `salida_venta` + reconocimiento de ingreso/COGS.

- [ ] En flujo VERIFIED: escribir `stock_movements` tipo `salida_venta` por línea (o agregado documentado)
- [ ] `balance_after` = `existence` tras el consume
- [ ] `sale_id` + `user_id` (operador) rellenados
- [ ] Registrar evento financiero: `revenue` (importe venta), `cogs` (= **último costo** × qty), `margin`
- [ ] UNVERIFIED / reserved: **no** crea evento financiero
- [ ] Idempotencia: segundo confirm no duplica movimiento ni eventos ni stock
- [ ] Reject/DELETED: sin `salida_venta` ni ingreso (solo release `reserved`)
- [ ] Tests o smoke: confirm → movement + finance event visibles

**Criterio de salida 2.2:** confirm deja traza de qty y de dinero; soft-hold sigue correcto.

---

## Fase 2.3 — Panel: factura de entrada, movimientos y ajuste (dash)

**Objetivo:** el back-office registra entradas como **factura** (costos + stock) y mantiene ajustes auditados.

### 2.3.1 Lectura

- [ ] Vista listado `stock_movements` (filtros: producto, tipo, rango fechas)
- [ ] Listado de facturas de entrada (`purchase_entry`) con proveedor y total
- [ ] Detalle de una entrada: líneas, costos, productos
- [ ] Chip de últimos movimientos / último costo en ficha de producto

### 2.3.2 Registrar entrada (UX principal — factura)

- [ ] Botón global **Registrar entrada** (no solo por fila de producto)
- [ ] Overlay/modal centrado a pantalla completa de contenido
- [ ] Cabecera: título, proveedor (buscar/crear), referencia factura, fecha
- [ ] Buscador de productos: nombre, ID, categoría
- [ ] Cada resultado: qty, costo unitario, concepto (compra / regalía / otro), [Añadir]
- [ ] Lista temporal de líneas (editar qty/costo, quitar línea)
- [ ] Crear producto nuevo en el flujo (nombre mínimo + categoría opcional + precio venta opcional)
- [ ] Confirmar: `existence +=` por línea + `stock_movements` `entrada` + `purchase_entry` + líneas
- [ ] Actualizar `last_unit_cost` si concepto compra y unit_cost definible
- [ ] `reserved` no cambia; toast de éxito; cierre modal
- [ ] Roles: owner/admin (sales según política; viewer no)

### 2.3.3 Atajo Core 1 (opcional)

- [ ] Mantener «Dar entrada» rápido en producto **o** redirigir al modal factura con producto preseleccionado
- [ ] Si se mantiene atajo: igual debe generar movimiento + costo (costo 0 o obligatorio)

### 2.3.4 Ajuste auditado

- [ ] UI ajuste (alta/baja) con motivo
- [ ] Validación: post-ajuste `existence >= reserved`
- [ ] Movimiento tipo `ajuste` + `balance_after`
- [ ] Roles: solo owner/admin (viewer no muta)

### 2.3.5 Devolución (si política aceptada en 2.0)

- [ ] Desde venta VERIFIED o inventario: `existence += qty` + `devolucion`
- [ ] Motivo obligatorio; no reabre soft-hold de la venta
- [ ] Impacto financiero documentado (reversión COGS / no re-ingreso) si aplica

**Criterio de salida 2.3:** se puede registrar una entrada multi-producto con proveedor y costos; stock y documento financiero coherentes; QA Core 1 stock PASS.

---

## Fase 2.4 — Reportes económicos, stock y cola UNVERIFIED (dash)

**Objetivo:** supervisión operativa **y** lectura económica básica.

### Operación
- [ ] Cola de ventas UNVERIFIED con **antigüedad** (ordenado por más viejo)
- [ ] Alerta o badge de stock bajo (umbral configurable o fijo documentado)
- [ ] Indicador de `reserved` alto / hold prolongado (regla documentada)
- [ ] RT / refresco de cola (reutilizar suscripción `sale` de Core 1)

### Economía (MVP)
- [ ] Resumen por periodo: **ingresos** (solo VERIFIED), **costo de entradas**, **COGS**, **margen bruto**
- [ ] Listado de entradas (facturas) filtrable por fecha / proveedor
- [ ] Export CSV: ventas confirmadas y/o entradas por rango
- [ ] UNVERIFIED **excluido** de ingresos

**Criterio de salida 2.4:** staff prioriza pedidos viejos y ve un resumen económico mínimo coherente con confirmaciones y entradas.

---

## Fase 2.5 — Reservas de taller (incluida en MVP)

> Decisión 2026-08-13: **dentro del MVP Core 2**.

- [ ] Collection `appointment` / `booking` (o nombre acordado) en Appwrite
- [ ] Estados: al menos solicitada → confirmada → realizada | cancelada
- [ ] Panel: sustituir placeholder del menú **Reservas** por listado + crear/editar estado
- [ ] **No** mostrar pedidos `Sale` de tienda en Reservas
- [ ] (Fuera de MVP) descuento de piezas por cita

**Criterio de salida 2.5:** agenda usable en panel sin contaminar Ventas.

---

## Fase 2.6 — Seguridad, CI y cierre DoD

**Objetivo:** endurecer y declarar Core 2 cerrado.

### Seguridad

- [ ] Auditoría de permisos Appwrite por rol (owner/admin/sales/viewer)
- [ ] Secrets solo en Cloudflare/Render (no en git)
- [ ] Viewer no muta stock, movimientos ni decisiones de venta (§6 Core 1)

### CI / plataforma

- [ ] `check` + `test:unit` + `build` en PR en verde
- [ ] (Opcional) decisión documentada go/no-go monorepo `AlejoTaller/admin`

### Documentación de cierre

- [ ] `MVP_CORE2_STATUS.md` → Core 2 cerrado + fecha
- [ ] Checklist de este plan en verde (fases obligatorias)
- [ ] Smoke: entrada → pedido → confirm (operador o dash) → movement `salida_venta`
- [ ] Regresión QA Core 1 (15 min) PASS

**Criterio de salida 2.6 = DoD Core 2 (borrador):**

1. `stock_movements` existe y registra al menos `entrada` y `salida_venta`.  
2. Panel registra **factura de entrada** multi-línea (proveedor + costos) y ajusta stock sin `existence < reserved`.  
3. Al VERIFIED se reconoce **ingreso/COGS/margen**; UNVERIFIED no mueve dinero.  
4. Soft-hold Core 1 sin regresión.  
5. Reservas de taller operativas y separadas de ventas B2C.  
6. STATUS del repo marca **Core 2 cerrado**.

---

## Fuera de este núcleo (Core 3+)

- Contabilidad / multi-almacén  
- Piezas de reparación descontando stock por cita  
- Function Appwrite atómica confirm+stock+movement (puede adelantarse si hace falta)  
- E2E automatizado completo tienda ↔ dash ↔ operador  

---

## Orden recomendado de trabajo

```text
2.0  alcance + políticas
2.1  schema Appwrite
2.2  operador salida_venta     ⎫ pueden solaparse en parte
2.3  dash movimientos/entrada ⎭
2.4  reportes / cola
2.5  reservas (en MVP)
2.6  seguridad + DoD
```
