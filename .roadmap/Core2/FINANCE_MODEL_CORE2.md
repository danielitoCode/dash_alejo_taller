# Core 2 — Modelo financiero (entradas + ventas)

**Fecha:** 2026-08-13  
**Estado:** **aceptado** (2026-08-13) · COGS = último costo · reservas de taller en MVP Core 2  
**No altera** soft-hold Core 1 (`existence` / `reserved` / `available`).

## Problema que resuelve

Core 1 solo contabiliza **unidades**. No hay:

- costo de adquisición por entrada
- proveedor / factura de compra
- margen al confirmar venta
- análisis económico (COGS, beneficio bruto)

Core 2 añade la capa **económica** encima del stock.

## Principios

1. **Stock y dinero se mueven en momentos distintos pero enlazados.**  
   - Entrada de mercancía → sube `existence` **y** registra costo.  
   - Reserva (UNVERIFIED) → solo `reserved`; **no** hay ingreso.  
   - Confirmación (VERIFIED) → consume stock **y** reconoce ingreso / margen.  
   - Rechazo (DELETED) → libera `reserved`; **no** hay ingreso ni costo de venta.

2. **La entrada deja de ser “+N en un producto” como UX principal.**  
   El flujo canónico Core 2 es **Registrar entrada** = documento tipo factura de compra (una o muchas líneas).

3. **El “Dar entrada” individual de Core 1 puede quedar** como atajo de ajuste rápido, pero el camino económico es la factura de entrada.

---

## Conceptos

| Concepto | Descripción |
|----------|-------------|
| **Proveedor** | Quién suministra mercancía (nombre, contacto opcional) |
| **Factura de entrada** (`purchase_entry` / `stock_entry`) | Cabecera: proveedor, fecha, referencia externa, total costo, staff |
| **Línea de entrada** | Producto, qty, costo unitario, (opcional) concepto regalía / donación / compra |
| **Costo de inventario** | Base para valoración; idealmente por movimiento o promedio documentado |
| **Ingreso por venta** | Al VERIFIED: ingreso = precio de venta de la línea/documento |
| **COGS / costo de venta** | Al VERIFIED: costo asociado a las unidades consumidas |
| **Margen bruto** | `ingreso − COGS` en esa confirmación |

---

## Flujo UX — Registrar entrada (panel)

```text
[Botón global: Registrar entrada]
        ↓
Overlay / modal centrado (superpuesto al contenido)
        ↓
Título: Registrar entrada
Proveedor (buscar / crear) + ref. factura + fecha
        ↓
Buscador: nombre | ID | categoría
        ↓
Resultados / referencias de producto
  · qty a insertar
  · costo unitario
  · concepto: compra | regalía | otro
  · [Añadir a la lista]
        ↓
Lista temporal de líneas (editable / quitar)
        ↓
Si no existe el producto → crear producto mínimo (nombre, categoría, precio venta opcional)
        ↓
[Confirmar entrada]
  → existence += qty por línea
  → stock_movements tipo entrada (qty + balance_after + reason)
  → documento purchase_entry + líneas con costos
  → actualiza last_unit_cost si concepto compra y unit_cost > 0
  → toast + cierre modal
```

### Crear producto en el mismo flujo

Mínimo viable:

- nombre (obligatorio)
- categoría (opcional)
- precio de venta de catálogo (opcional; no confundir con costo)
- luego se añade como línea con qty + costo unitario

---

## Flujo económico — Venta

| Evento | Stock (Core 1) | Finanzas (Core 2) |
|--------|----------------|-------------------|
| Cliente UNVERIFIED | `reserved +=` | **Sin** ingreso ni COGS |
| Confirm VERIFIED | `existence -=`, `reserved -=` | **Ingreso** + **COGS** + margen; traza `salida_venta` |
| Reject DELETED | `reserved -=` | **Sin** movimiento financiero |
| Registrar entrada | `existence +=` | Costo de compra / regalía en documento de entrada |

---

## Tipos de datos (propuesta Appwrite)

### `supplier`

| Campo | Tipo | Notas |
|-------|------|--------|
| name | string | obligatorio |
| contact | string? | |
| notes | string? | |

### `purchase_entry` (cabecera factura de entrada)

| Campo | Tipo | Notas |
|-------|------|--------|
| supplier_id | string? | null si regalía interna sin proveedor |
| reference | string? | nº factura proveedor |
| entry_date | datetime | |
| total_cost | number | suma líneas (0 si todo regalía) |
| currency | string | alineada al negocio |
| user_id | string | staff |
| notes | string? | |
| line_count | int | |

### `purchase_entry_line`

| Campo | Tipo | Notas |
|-------|------|--------|
| entry_id | string | |
| product_id | string | |
| quantity | int | > 0 |
| unit_cost | number | ≥ 0 |
| concept | enum | `purchase` \| `royalty` \| `other` |
| line_cost | number | qty × unit_cost |

### Extensión venta / movimiento (al VERIFIED)

**Collection `sale_finance_event`** (recomendado): `sale_id`, `revenue`, `cogs`, `margin`, `user_id`, `at`  
+ `salida_venta` en `stock_movements` solo para qty.

### Producto (campos Core 2)

| Campo | Uso |
|-------|-----|
| `last_unit_cost` | último costo de entrada de compra; base del COGS |

**MVP (decisión 2026-08-13):** COGS = **último costo** (`last_unit_cost` del producto, actualizado en cada línea de entrada con concepto compra; regalía puede dejar costo 0 o no actualizar según regla de línea).

- No se usa promedio móvil en Core 2 (puede distorsionar margen y generar “pérdidas” contables engañosas).
- FIFO/LIFO por lote queda fuera (Core 3+).
- Al VERIFIED: `cogs = last_unit_cost × qty` (por línea de producto); si no hay costo previo, `cogs = 0` y se registra advertencia/log.

---

## Análisis económico (vistas panel)

MVP de lectura:

1. **Costo de entradas** por periodo (suma `purchase_entry.total_cost`)  
2. **Ingresos** por periodo (suma revenue de confirmaciones)  
3. **COGS** del mismo periodo  
4. **Margen bruto** = ingresos − COGS  
5. Por producto (opcional MVP+): unidades vendidas, ingreso, costo estimado, margen

Reservas / UNVERIFIED **no** aparecen como ingreso.

---

## Qué no es Core 2 finanzas

- Contabilidad de doble partida / asientos contables formales  
- Impuestos / retenciones  
- Multi-moneda con tipos de cambio vivos  
- FIFO/LIFO estricto por lote (puede ser Core 3)  
- Cuentas por pagar al proveedor (puede listarse como deuda futura)

---

## Relación con fases del plan

| Fase | Encaje finanzas |
|------|-----------------|
| 2.0 | Modelo **aceptado**; COGS = último costo |
| 2.1 | Schema: `supplier`, `purchase_entry`, líneas; además `stock_movements` |
| 2.2 | Al VERIFIED: evento financiero (revenue/COGS) + `salida_venta` qty |
| 2.3 | UX **Registrar entrada** (factura) + listados |
| 2.4 | Reportes: margen, entradas vs ventas, no solo stock |
| 2.6 | Roles: viewer solo lectura finanzas |
