# Core 4 — Checklist unificado (dash + AlejoTaller)

**Estado:** **CERRADO** (2026-09-02)  
**Rama:** `Core4` · PRs: [dash #21](https://github.com/danielitoCode/dash_alejo_taller/pull/21) · [AT #28](https://github.com/danielitoCode/AlejoTaller/pull/28)

Convención: **DASH** = `dash_alejo_taller` · **AT** = `AlejoTaller` · **BOTH** = ambos.

---

## B0 — Baseline, política y schema — **CERRADO**

- [x] **BOTH** Core 2: finance solo en VERIFIED
- [x] **BOTH** Core 3 / `last_unit_cost` documentado
- [x] **DASH** Política + SCHEMA + Opción A (`lines_json`)
- [x] **DASH** Atributo provisionado en Appwrite
- [x] **AT** Docs espejo

## B1 — Contrato de dominio — **CERRADO**

- [x] **DASH** `SaleFinanceEvent` + líneas + `buildFinanceEventFromSale` + mapper
- [x] **DASH** `RegisterSaleFinanceFromVerifiedCaseUse`
- [x] **AT** `SaleFinanceWrite` / `SaleFinanceLineWrite` + repo `lines_json`
- [x] **DASH** Unit build + mapper

## B2 — Confirm panel — **CERRADO**

- [x] Confirm con snapshot por línea
- [x] Smoke panel 2026-09-01 (`lines_json`, cogs/margin)

## B3 — Confirm operador — **CERRADO**

- [x] Case use + `createIdempotent` + unit (lines, DELETED, costo 0)
- [x] Frontera cliente/MCP sin write (docs + código)
- [ ] Smoke device (opcional, no bloquea cierre)

## B4 — Idempotencia y estabilidad — **CERRADO**

- [x] **DASH** Unit no-reescritura + reconcile solo faltantes
- [x] **AT** Unit 2º confirm / createIdempotent no sobrescribe

## B5 — Tests y paridad — **CERRADO**

- [x] Margen doc vs Σ líneas + POLICY §3.3
- [x] [PARITY_PANEL_OPERATOR.md](./PARITY_PANEL_OPERATOR.md)
- [x] Register idempotente (unit)

## B6 — Permisos, smoke y cierre — **CERRADO (producto)**

- [x] REJECT sin finance (código + unit)
- [x] Confirm registra finance (unit)
- [x] MCP / web sin write finance
- [x] PRs abiertos hacia `master`
- [x] [B6_PERMISSIONS_AND_BOUNDARY.md](./B6_PERMISSIONS_AND_BOUNDARY.md)
- [ ] CI verde + merge (operativo al aceptar PRs)
- [ ] Checklist manual Appwrite: cliente sin write (operativo)

---

## Registro de cierre

| Fecha | Nota |
|---|---|
| 2026-09-01 | B0–B3 |
| 2026-09-02 | B4–B5; B6 frontera/unit/PRs; **cierre oficial de producto** |
