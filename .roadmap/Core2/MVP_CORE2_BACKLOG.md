# Core 2 — Backlog detallado (Back-office)

**Última actualización:** 2026-08-13  
**Plan maestro:** [`CORE2_IMPLEMENTATION_PLAN.md`](./CORE2_IMPLEMENTATION_PLAN.md)  
**Finanzas:** [`FINANCE_MODEL_CORE2.md`](./FINANCE_MODEL_CORE2.md) — COGS = último costo

Este archivo desglosa micro-tareas. El **avance oficial** se marca en el plan por fases.

---

## 2.1 Inventario formal + finanzas (schema + panel)

- [ ] Schema: `supplier`, `purchase_entry`, `purchase_entry_line`, `stock_movements`, evento financiero de venta
- [ ] UI **Registrar entrada** (modal factura multi-línea: búsqueda, qty, costo, proveedor, regalía)
- [ ] Crear producto mínimo desde el flujo de entrada
- [ ] UI de movimientos y listado de facturas de entrada
- [ ] Ajuste manual auditado (nunca `existence < reserved`) + fila `ajuste`
- [ ] Devolución formal post-VERIFIED (si política 2.0 la incluye)
- [ ] Al VERIFIED: revenue / COGS (`last_unit_cost` × qty) / margen (dash y/o operador)

## 2.2 Reportes y supervisión

- [ ] Resumen económico por periodo (ingresos, COGS, margen, costo entradas)
- [ ] Alertas stock bajo / reserved alto prolongado
- [ ] Export CSV ventas confirmadas y/o entradas
- [ ] Vista “cola UNVERIFIED” con antigüedad

## 2.3 Tiempo real y DX

- [ ] Suscripción Appwrite a `sale` para cola (reforzar Core 1 si hace falta)
- [ ] Logs de panel sin filtrar PII de más / sin secretos

## 2.4 Plataforma

- [ ] Dominio/hosting admin distinto de la tienda pública (si aplica)
- [ ] Decisión go/no-go integración monorepo `AlejoTaller/admin`
- [ ] CI: `check` + `test` + `build` en PR

## 2.5 Seguridad

- [ ] Auditoría de permisos Appwrite por rol
- [ ] Workers solo con secrets en Cloudflare/Render
- [ ] Historial git limpio de `.env` si hubo fuga
- [ ] Viewer: solo lectura en stock/ventas/movimientos/finanzas

## 2.6 Reservas de taller (incluida en MVP — 2026-08-13)

- [ ] Collection + estados de cita
- [ ] UI menú Reservas (dejar de ser placeholder)
- [ ] Separación estricta respecto a Ventas B2C
