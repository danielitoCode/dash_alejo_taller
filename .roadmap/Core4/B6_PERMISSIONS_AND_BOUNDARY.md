# Core 4 B6 — Permisos, frontera y smoke

**Fecha:** 2026-09-02 · rama `Core4`

---

## 1. Quién puede escribir `sale_finance_event`

| Actor | Write | Evidencia |
|-------|-------|-----------|
| Panel dash (`ConfirmSaleFromPanelCaseUse` → `RegisterSaleFinanceFromVerifiedCaseUse`) | Sí | Código + unit B6 |
| Operador scan (`ApplyOperatorStockDecisionCaseUse` → `createIdempotent`) | Sí | Unit B3/B4 |
| `RejectSaleFromPanelCaseUse` | **No** | Sin dependencia finance; unit B6 |
| Operador `confirmed=false` (DELETED) | **No** | Unit B3 |
| Cliente web AlejoTaller | **No** | Sin create finance en `web/` |
| MCP B2C | **No** | `SCOPE_B2C.md` / `DATA_CONTRACT.md` prohíben la colección |

### Appwrite (checklist manual en consola)

- Roles staff (owner/admin/sales/operator): create/read en `sale_finance_event` según rol de confirmación.
- Rol cliente / anónimo: **sin** create/update en `sale_finance_event`.
- Si hoy el cliente hereda write amplio, restringir antes de merge a producción.

---

## 2. Smoke residual

| Caso | Esperado | Estado |
|------|----------|--------|
| Panel confirm → event con `lines_json` | Doc creado | **Hecho** B2 2026-09-01 |
| Panel REJECT UNVERIFIED | Sin finance nuevo | **Código + unit** (smoke UI manual opcional) |
| Operador confirm | Finance + lines | Código listo; smoke device opcional |
| Operador reject | Sin finance | Unit |

---

## 3. PRs

- dash: https://github.com/danielitoCode/dash_alejo_taller/pull/21
- AT: abrir/seguir PR `Core4` → `master` cuando CI verde

Merge solo con CI verde.
