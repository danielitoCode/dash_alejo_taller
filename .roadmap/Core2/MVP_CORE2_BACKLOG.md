# Core 2 — Backlog detallado (Back-office)

**Última actualización:** 2026-08-12  
**Plan maestro:** [`CORE2_IMPLEMENTATION_PLAN.md`](./CORE2_IMPLEMENTATION_PLAN.md)

Este archivo desglosa micro-tareas. El **avance oficial** se marca en el plan por fases.

---

## 2.1 Inventario formal (schema + panel)

- [ ] UI de movimientos (`stock_movements`) alineada al schema AlejoTaller
- [ ] Entrada de mercancía (+existence) con motivo y usuario staff + fila `entrada`
- [ ] Ajuste manual auditado (nunca `existence < reserved`) + fila `ajuste`
- [ ] Devolución formal post-VERIFIED (si política 2.0 la incluye)

## 2.2 Reportes y supervisión

- [ ] Alertas stock bajo / reserved alto prolongado
- [ ] Export mínimo CSV de ventas por rango de fechas
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
- [ ] Viewer: solo lectura en stock/ventas/movimientos

## 2.6 Reservas de taller (opcional MVP)

- [ ] Collection + estados de cita
- [ ] UI menú Reservas (dejar de ser placeholder)
- [ ] Separación estricta respecto a Ventas B2C
