# Core 5 — Supervisión y Reportes

## Objetivo

Convertir los datos confiables de inventario, compras y ventas en herramientas de supervisión operativa y reportes.

## Alcance

- Dashboard operativo.
- Ventas pendientes y antigüedad de `UNVERIFIED`.
- Alertas de stock bajo.
- Inventario y movimientos consultables.
- Ingresos, COGS y margen por periodo.
- Reportes de compras.
- Filtros por fecha y producto.
- Exportación CSV de datos operativos.
- KPIs derivados de las fuentes canónicas.

## Regla

Los reportes deben leer datos fuente; no deben mantener una segunda contabilidad ni modificar inventario.

## Fuera de alcance

- Nuevas reglas de stock.
- Contabilidad general.
- Reservas de taller.

## Definition of Done

- [ ] KPIs operativos disponibles.
- [ ] Reportes de inventario.
- [ ] Reportes de ventas.
- [ ] Reportes de compras.
- [ ] Reportes de margen.
- [ ] Filtros funcionales.
- [ ] Exportación CSV.
- [ ] Datos reconciliados con las fuentes canónicas.
- [ ] Tests de cálculo y filtros.

## Dependencias

Core 2, Core 3 y Core 4.

## Siguiente Core

Core 6 — Taller y reservas.
