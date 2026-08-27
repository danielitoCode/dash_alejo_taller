# Core 2 — Backlog detallado (Back-office)

**Última actualización:** 2026-08-27  
**Estado del núcleo:** **cerrado** (2026-08-24, PR #12)  
**Plan maestro:** [`CORE2_IMPLEMENTATION_PLAN.md`](./CORE2_IMPLEMENTATION_PLAN.md)  
**Finanzas:** [`FINANCE_MODEL_CORE2.md`](./FINANCE_MODEL_CORE2.md) — COGS = último costo

Este archivo conserva el desglose histórico. El **cierre oficial** está en [`CORE2_UNIFIED_CHECKLIST.md`](./CORE2_UNIFIED_CHECKLIST.md) y [`MVP_CORE2_STATUS.md`](./MVP_CORE2_STATUS.md).

---

## 2.1 Inventario formal + finanzas (schema + panel)

- [x] Schema: `purchase_entry`, `purchase_entry_line`, `stock_movements`, evento financiero de venta
- [x] UI **Registrar entrada** (modal factura multi-línea: búsqueda, qty, costo, proveedor)
- [x] Crear producto mínimo desde el flujo de entrada
- [x] UI de movimientos y listado de facturas de entrada
- [ ] **Ajuste manual auditado** (nunca `existence < reserved`) + fila `ajuste` — **futura implementación** (UI no disponible)
- [ ] Devolución formal post-VERIFIED — **futura implementación**
- [x] Al VERIFIED: revenue / COGS (`last_unit_cost` × qty) / margen (dash y operador)

## 2.2 Reportes y supervisión

- [x] Cola / KPIs finance (mínimo viable Core 2)
- [ ] Resumen económico por periodo ampliado — post-Core 2
- [ ] Alertas stock bajo / reserved alto — post-Core 2
- [ ] Export CSV — post-Core 2

## 2.3 Tiempo real y DX

- [x] Suscripción / badges cola (nivel Core 2)
- [ ] Logs de panel sin filtrar PII de más — continuo

## 2.4 Plataforma

- [x] CI: `check` + `test` + `build` en PR
- [ ] Dominio/hosting admin distinto de la tienda — opcional

## 2.5 Seguridad

- [x] Auditoría de permisos Appwrite por rol (cierre B6)
- [x] Viewer: solo lectura en stock/ventas/movimientos/finanzas (baseline)

## 2.6 Reservas de taller

- [x] Collection + estados de cita
- [x] UI menú Reservas en dash (gobierno)
- [x] Separación estricta respecto a Ventas B2C
- [ ] Solicitud desde cliente web — **futura implementación**
