# Core 4 B6 — Permisos, frontera y cierre

**Fecha cierre producto:** 2026-09-02

---

## 1. Write a `sale_finance_event`

| Actor | Write | Evidencia |
|-------|-------|-----------|
| Panel confirm | Sí | Código + unit |
| Operador scan confirm | Sí | Unit B3/B4 |
| Panel REJECT | No | Código + unit |
| Operador DELETED | No | Unit |
| Cliente web | No | Sin create en web |
| MCP B2C | No | SCOPE / DATA_CONTRACT |

## 2. Appwrite (operativo al merge)

- [ ] Rol cliente / anónimo: sin create/update en `sale_finance_event`
- [ ] Roles staff de confirmación: create/read según política de roles

## 3. PRs de cierre

- dash: https://github.com/danielitoCode/dash_alejo_taller/pull/21
- AT: https://github.com/danielitoCode/AlejoTaller/pull/28

Merge solo con **CI verde**.
