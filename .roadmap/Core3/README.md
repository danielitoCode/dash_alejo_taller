# Core 3 — Compras y Abastecimiento

**Estado:** listo para merge · rama `Core3` · **B1+B2+B3.1+B4**  
**Dependencia:** Core 2 cerrado (2026-08-24)  
**Monorepo espejo:** [AlejoTaller/.roadmap/Core3](https://github.com/danielitoCode/AlejoTaller/tree/Core3/.roadmap/Core3)

## Evaluación respecto al plan original

El README histórico de Core 3 listaba proveedores, `purchase_entry`, costos y movements `entrada`. **Gran parte de ese MVP ya se entregó en Core 2**. Core 3 **madura** el dominio: gobierno de proveedores, historial, anulación completa (B3.1) y permisos.

## Documentos

| Doc | Rol |
|------|-----|
| [POLICY_PURCHASE_CORE3.md](./POLICY_PURCHASE_CORE3.md) | Quién escribe, contact required, soft-hold, anulación |
| [POLICY_CURRENCY_CORE3.md](./POLICY_CURRENCY_CORE3.md) | USD default, CUP + Directorio Cubano, price protection +30% |
| [SCHEMA_AUDIT_CORE3.md](./SCHEMA_AUDIT_CORE3.md) | Gaps consola vs código (status provisionado) |
| [CORE3_UNIFIED_CHECKLIST.md](./CORE3_UNIFIED_CHECKLIST.md) | Orden B0–B6 |
| [MVP_CORE3_STATUS.md](./MVP_CORE3_STATUS.md) | Estado vivo + smokes |
| [B3.1_APPWRITE_INTEGRATION.md](./B3.1_APPWRITE_INTEGRATION.md) | Integración transaccional Appwrite |

## Entregado (release mínimo)

- Proveedores UI + selector en factura de entrada
- Historial Compras (listado → detalle + filtro producto)
- Anulación completa B3.1 (transacción Appwrite, bloqueo si `existence - qty < reserved`, UI owner/admin, badge Anulada, UI no optimista)
- Permisos/roles panel (compras/proveedores solo owner/admin)
- UX: toast unificado con iconos + loading que sobrevive navegación; sin botones flotantes RealtimeDock

## Orden lógico (cerrado)

```text
B0 ✓ → B1 ✓ → B2 ✓ → B4 panel ✓ → B3.1 ✓ → B6 (PR → master)
```

B3.2 (corrección parcial) **no bloquea** y queda como trabajo post-merge.

## Criterio de merge a `master`

| Condición | ¿Merge? |
|---|---|
| B1+B2+B3.1+B4 | **Sí** — release con anulación completa |
| B3.2 | No bloquea |
