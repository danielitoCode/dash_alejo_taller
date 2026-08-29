# Core 3 — Compras y Abastecimiento

**Estado:** en curso · rama `Core3` · **B1+B2 smoke UI OK**  
**Dependencia:** Core 2 cerrado (2026-08-24)  
**Monorepo espejo:** [AlejoTaller/.roadmap/Core3](https://github.com/danielitoCode/AlejoTaller/tree/Core3/.roadmap/Core3)

## Evaluación respecto al plan original

El README histórico de Core 3 listaba proveedores, `purchase_entry`, costos y movements `entrada`. **Gran parte de ese MVP ya se entregó en Core 2**. Core 3 **madura** el dominio: gobierno de proveedores, historial, anulación y permisos.

## Documentos

| Doc | Rol |
|------|-----|
| [POLICY_PURCHASE_CORE3.md](./POLICY_PURCHASE_CORE3.md) | Quién escribe, contact required, soft-hold |
| [SCHEMA_AUDIT_CORE3.md](./SCHEMA_AUDIT_CORE3.md) | Gaps consola vs código |
| [CORE3_UNIFIED_CHECKLIST.md](./CORE3_UNIFIED_CHECKLIST.md) | Orden B0–B6 |
| [MVP_CORE3_STATUS.md](./MVP_CORE3_STATUS.md) | Estado vivo + smokes |

## Smoke UI (2026-08-27)

- Nav **Proveedores** + **Compras**
- Alta de proveedor desde factura de entrada
- Listado de compras → click → detalle

## Orden lógico

```text
B0 ✓ → B1 ✓ → B2 ✓ → B4 panel ✓ → B3.1 schema ✓ → UI anular → smoke AT → B6
```

B3.2 (corrección parcial) no bloquea. Test opcional COGS AT no bloquea.

## Criterio de merge a `master`

Release mínimo: **B1+B2+B4**. B3 opcional.
