# Core 2 — Backlog Back-office

**Última actualización:** 2026-08-09

## Fases sugeridas

### 2.1 Inventario formal
- [ ] UI de movimientos (`stock_movements`) alineada al schema de AlejoTaller Core 2
- [ ] Entrada de mercancía (+existence) con motivo y usuario staff
- [ ] Ajuste manual auditado (nunca `existence < reserved`)
- [ ] Devolución formal post-VERIFIED (regla de negocio explícita)

### 2.2 Reportes y supervisión
- [ ] Alertas stock bajo / reserved alto prolongado
- [ ] Export mínimo CSV de ventas por rango de fechas
- [ ] Vista “cola UNVERIFIED” con antigüedad

### 2.3 Tiempo real y DX
- [ ] Suscripción Appwrite a `sale` UNVERIFIED (opcional, sin Pusher)
- [ ] Terminal/logs de panel sin filtrar PII

### 2.4 Plataforma
- [ ] Dominio/hosting admin distinto de la tienda pública
- [ ] Decisión go/no-go integración monorepo `AlejoTaller/admin`
- [ ] CI: `check` + `test` en PR

### 2.5 Seguridad
- [ ] Auditoría de permisos Appwrite por rol
- [ ] Workers solo con secrets en Cloudflare/Render
- [ ] Historial git limpio de `.env` si hubo fuga
