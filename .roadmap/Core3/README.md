# Core 3 — Compras y Abastecimiento

**Estado:** en curso · rama `Core3` · **B0 dash completado**  
**Dependencia:** Core 2 cerrado (2026-08-24)  
**Monorepo espejo:** [AlejoTaller/.roadmap/Core3](https://github.com/danielitoCode/AlejoTaller/tree/Core3/.roadmap/Core3)

## Evaluación respecto al plan original

El README histórico de Core 3 listaba proveedores, `purchase_entry`, costos y movements `entrada`. **Gran parte de ese MVP ya se entregó en Core 2**. Core 3 **madura** el dominio: gobierno de proveedores, historial, anulación y permisos.

## Documentos B0

| Doc | Rol |
|------|-----|
| [POLICY_PURCHASE_CORE3.md](./POLICY_PURCHASE_CORE3.md) | Quién escribe, contact required, soft-hold |
| [SCHEMA_AUDIT_CORE3.md](./SCHEMA_AUDIT_CORE3.md) | Gaps consola vs código |
| [CORE3_UNIFIED_CHECKLIST.md](./CORE3_UNIFIED_CHECKLIST.md) | Orden B0–B6 |
| [MVP_CORE3_STATUS.md](./MVP_CORE3_STATUS.md) | Estado vivo |

## Hallazgo B0 (supplier)

En Appwrite real: **`contact` es required**. El doc Core 2 lo marcaba opcional. El código escribe siempre `contact: string` (permite `""`).

## Orden lógico

```text
B0 ✓ (dash) → B1 Proveedores UI → B2 Historial → B3 Anulación? → B4 Smoke → B5 AT → B6 Merge
```

## Criterio de merge a `master`

No mergear solo B0 de código salvo acuerdo de docs. Release mínimo: **B1+B2+B4**. Ver checklist.
