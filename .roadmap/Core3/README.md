# Core 3 — Compras y Abastecimiento

## Objetivo

Registrar de forma trazable de dónde proviene el inventario y cuál fue su costo de adquisición.

## Alcance

- Proveedores.
- Entradas comerciales.
- Facturas de compra.
- `purchase_entry` y `purchase_entry_line`.
- Cantidades y costos unitarios.
- Actualización de `last_unit_cost`.
- Generación de movimientos de entrada de Core 2.
- Historial y auditoría de compras.

## Fuera de alcance

- COGS y margen de ventas.
- Reportes financieros avanzados.
- Reservas de taller.

## Definition of Done

- [ ] Proveedores gestionables.
- [ ] Entrada de compra con múltiples líneas.
- [ ] Costos persistidos correctamente.
- [ ] Stock actualizado mediante el contrato de Core 2.
- [ ] Movimiento `IN` generado.
- [ ] `last_unit_cost` actualizado.
- [ ] Operaciones auditables.
- [ ] Tests de integración.

## Dependencia

Core 2 — Inventario Trazable.

## Siguiente Core

Core 4 — Finanzas de ventas.
