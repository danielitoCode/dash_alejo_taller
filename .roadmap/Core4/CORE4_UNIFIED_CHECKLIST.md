# Core 4 — Checklist unificado (dash + AlejoTaller)

**Última actualización:** 2026-09-02  
**Rama:** `Core4` en ambos repos.  
**Release mínimo:** B0–B5 + B6 (CI + frontera).

Convención: **DASH** = `dash_alejo_taller` · **AT** = `AlejoTaller` · **BOTH** = ambos.

---

## B0 — Baseline, política y schema

- [x] **BOTH** Core 2 confirmado: `sale_finance_event` al VERIFIED; UNVERIFIED/DELETED sin finance
- [x] **BOTH** Core 3: dependencia de `last_unit_cost` documentada
- [x] **DASH** Política [POLICY_SALE_FINANCE_CORE4.md](./POLICY_SALE_FINANCE_CORE4.md) aceptada
- [x] **DASH** [SCHEMA_AUDIT_CORE4.md](./SCHEMA_AUDIT_CORE4.md) completado
- [x] **DASH** Opción A (`lines_json`) — MVP
- [x] **DASH** Atributo `lines_json` provisionado
- [x] **AT** Política / docs espejo

**Salida B0:** completa 2026-09-01.

---

## B1 — Contrato de dominio (snapshot + líneas)

- [x] **DASH** Entidad + `buildFinanceEventFromSale` + mapper + Register use case
- [x] **AT** `SaleFinanceWrite` / lines + repo `lines_json`
- [x] **DASH** Unit build + mapper

**Salida B1:** completa 2026-09-01.

---

## B2 — Confirm panel (dash)

- [x] Confirm genera event con snapshot por línea
- [x] Smoke panel 2026-09-01

**Salida B2:** completa.

---

## B3 — Confirm operador (AT)

- [x] Case use + createIdempotent + unit (DELETED / lines / costo 0)
- [ ] Smoke device (opcional)

**Salida B3:** código completo.

---

## B4 — Idempotencia y estabilidad

- [x] **DASH** Unit no-reescritura + reconcile solo faltantes
- [x] **AT** Unit createIdempotent / 2º confirm

**Salida B4:** completa 2026-09-02.

---

## B5 — Tests y paridad

- [x] Margen doc vs Σ líneas + POLICY §3.3
- [x] [PARITY_PANEL_OPERATOR.md](./PARITY_PANEL_OPERATOR.md)

**Salida B5:** completa 2026-09-02.

---

## B6 — Permisos, smoke y cierre

- [x] **DASH** Frontera código: REJECT sin finance; confirm sí registra *(unit 2026-09-02)*
- [x] **DASH** Smoke UI confirm *(B2)*
- [x] **DASH** REJECT sin finance *(unit + código; smoke UI opcional)*
- [x] **AT** MCP/docs prohíben write `sale_finance_event`; web sin create finance
- [ ] **DASH** Permisos Appwrite consola: cliente sin write (checklist manual en [B6_PERMISSIONS_AND_BOUNDARY.md](./B6_PERMISSIONS_AND_BOUNDARY.md))
- [ ] **AT** Smoke operador device (opcional)
- [ ] **DASH** CI verde en [PR #21](https://github.com/danielitoCode/dash_alejo_taller/pull/21)
- [ ] **AT** CI verde en PR `Core4` → `master`
- [ ] **BOTH** Merge cuando CI verde

**Salida B6:** en curso — código/frontera listos; CI + permisos consola + merge pendientes.

---

## Registro

| Fecha | Nota |
|---|---|
| 2026-09-01 | B0–B3 |
| 2026-09-02 | B4–B5 |
| 2026-09-02 | B6: unit REJECT/confirm finance; PR dash #21; permisos doc |
