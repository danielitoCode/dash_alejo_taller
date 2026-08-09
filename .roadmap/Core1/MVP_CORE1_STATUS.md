# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto desarrollo:** **parcial** — app usable (auth, catálogo, ventas, promos, support) pero **desalineada** respecto al soft-hold / reserved / Realtime / currency de AlejoTaller Core 1.

## Fase 0 — Baseline alineación

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **0.1** Congelar reglas canónicas | **Hecho** | [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md) |
| **0.2** Higiene secretos (`.env` / `.npm-cache`) | Pendiente | — |
| **0.3** Inventario de archivos a tocar | Pendiente | — |

## Resumen de alcance

| Área | Estado desarrollo | Notas |
|------|-------------------|-------|
| Auth staff + roles | Parcial | `RoleConfig` existe; falta validar gates en todas las rutas y política formal |
| User management (operadores) | Parcial | CRUD usuarios; alinear con labels Appwrite y `canManageRole` |
| Product CRUD | Parcial | Modelo local tiene `existence` pero **no `reserved`** |
| Category CRUD | Hecho (base) | Offline-first presente |
| Sale list / detail / verify | Parcial | `UpdateSaleVerifiedCaseUse` existe; **no garantizado** consume/release atómico |
| Currency en detalle de venta | Pendiente | Debe mostrar moneda del pedido (paridad operador) |
| Soft-hold respect | Pendiente | Panel no debe pisar `reserved` al editar existence a ciegas |
| Realtime stock/sale | Pendiente | Clientes ya usan Appwrite RT; dash aún orientado a flujos legacy/Pusher support |
| Secretos / `.env` en repo | Deuda | Core 1 exige higiene mínima (tarea **0.2**) |
| QA checklist | Documentado | Ejecución **después** de alineación código |

## Micro-tareas Core 1 (checklist desarrollo)

### Auth / panel
- [ ] Documentar e implementar gates por ruta según `ROLE_ROUTE_ACCESS`
- [ ] `sales` no gestiona usuarios ni catálogo; `viewer` solo lectura
- [ ] `owner`/`admin` únicos que asignan roles; `canManageRole` en UI y backend function
- [ ] Sin sesión de tienda visitante en este panel

### Product / warehouse
- [ ] Entidad y DTO con `existence` + `reserved` (+ `available` derivado en UI)
- [ ] Listado/detalle muestran available y reserved (no solo existence)
- [ ] Alta/edición de producto: `existence >= 0`; `reserved` no editable a mano en Core 1 (salvo tool admin documentada)
- [ ] Ajuste de existence no reduce por debajo de `reserved`
- [ ] Sync offline-first no sobrescribe reserved remoto con 0 local por defecto

### Sale (supervisión)
- [ ] Listado filtra UNVERIFIED / VERIFIED / DELETED
- [ ] Confirmar venta → misma semántica que operador: `existence -=`, `reserved -=` (atómico si posible)
- [ ] Rechazar venta → solo libera `reserved`
- [ ] Idempotencia: no doble consume/release
- [ ] UI muestra `currency` + amount del cliente
- [ ] No crear ventas B2C desde el panel en Core 1 (solo supervisión)

### Seguridad / repo
- [ ] `.env` fuera de git; solo `.env.example`
- [ ] No commitear `.npm-cache`
- [ ] API keys de workers no embebidas en bundle admin sin necesidad

### QA
- [ ] Ejecutar `QA_CORE1_CHECK_plan.md`
- [ ] Humo cruzado: pedido desde tienda → visible y accionable en dash sin romper stock

Cuando el checklist QA esté en verde → **cerrar Core 1 dash** formalmente.
