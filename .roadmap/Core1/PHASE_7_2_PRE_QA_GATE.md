# Fase 7.2 — Puerta pre-QA (gate operativo)

**Estado:** HECHO (paquete de gate publicado)  
**Fecha:** 2026-08-10  
**Depende de:** [`PHASE_7_1_ALIGNMENT_EXIT.md`](./PHASE_7_1_ALIGNMENT_EXIT.md)  
**Contrato:** [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md)

> **Qué es 7.2:** la secuencia operativa obligatoria **antes** de marcar el QA formal en verde.  
> **Qué no es 7.2:** la ejecución del QA en sí (eso es marcar casillas en `QA_CORE1_CHECK_plan.md`).

---

## 0. Orden no negociable

```text
7.1 Alineación código          ✓ (cerrada)
        │
        ▼
7.2 Gate pre-QA (este doc)     ← comandos + smoke + registro
        │
        ▼
QA_CORE1_CHECK_plan.md         ← checklist formal del núcleo
```

No se declara **Core 1 dash cerrado** solo con tests unitarios. Hace falta smoke cruzado + checklist QA.

---

## 1. Gate A — Calidad local (automático)

Ejecutar en el repo del dash, con dependencias instaladas:

```bash
npm ci          # o npm install
npm run test:unit
npm run check
npm run build
```

| Check | Resultado |
|-------|-----------|
| `test:unit` | ☐ PASS · ☐ FAIL |
| `check` (svelte-check + tsc) | ☐ PASS · ☐ FAIL |
| `build` | ☐ PASS · ☐ FAIL |

**Criterio Gate A:** los tres en PASS. Si falla `check`/`build` por deuda previa no relacionada con stock, documentar excepción; si falla por fases 5–6, **no** pasar a smoke.

---

## 2. Gate B — Entorno

| # | Requisito | ☐ |
|---|-----------|---|
| B1 | `.env` local **no** commiteado; claves desde `.env.example` | |
| B2 | `VITE_APPWRITE_*` apuntan a **staging** (o proyecto de prueba) | |
| B3 | Usuario staff dash (`admin`/`owner`/`sales`) | |
| B4 | Usuario cliente tienda (web o Android) | |
| B5 | Producto con `existence`/`reserved` conocidos (anotar IDs) | |
| B6 | Consola Appwrite abierta (`product` + `sale`) | |

---

## 3. Gate C — Smoke cruzado (obligatorio)

Seguir al pie de la letra: [`SMOKE_6_2.md`](./SMOKE_6_2.md)

| Camino | ☐ |
|--------|---|
| A Confirm (VERIFIED + stock) | PASS / FAIL |
| B Reject (DELETED + release reserved) | PASS / FAIL |
| Negativos N1–N3 | PASS / FAIL |

**Criterio Gate C:** A y B en PASS. FAIL de stock → volver a código (5.x / 6.x), no a QA de relleno.

Registro mínimo (copiar también en el smoke):

```text
Fecha: _______________
Entorno: _______________
Gate A: PASS / FAIL
Gate B: completo sí/no
Smoke A: PASS / FAIL
Smoke B: PASS / FAIL
Negativos: PASS / FAIL
Notas:
```

---

## 4. Gate D — Entrada a QA formal

Solo si **A + C** están en PASS (B completo):

1. Abrir [`QA_CORE1_CHECK_plan.md`](./QA_CORE1_CHECK_plan.md)
2. Ejecutar bloques **A → E** (auth, catálogo, ventas, seguridad, E2E)
3. El smoke 6.2 **cubre** gran parte de C1.x y E1–E3; no omitir el resto del checklist

| Tras QA formal | Acción |
|----------------|--------|
| Todo verde | Declarar **Core 1 dash cerrado** en `MVP_CORE1_STATUS.md` |
| Fallo stock/semántica | Reabrir freeze + fix; no “apagar” checkbox |
| Fallo cosmético UI | Registrar deuda; no bloquea semántica si C/E verdes |

---

## 5. Matriz de decisión rápida

| Situación | Decisión |
|-----------|----------|
| Unit tests fallan en políticas stock | No smoke |
| Smoke A FAIL (existence no baja) | Fix `ConfirmSaleFromPanel` / `applyStockDeltas` |
| Smoke B FAIL (existence baja en reject) | Fix reject path (`confirmed: false`) |
| Smoke PASS, QA A1.x roles FAIL | Fix gates Fase 3; stock OK |
| Todo PASS | Core 1 formal cerrado → Core 2 opcional |

---

## 6. Criterio de aceptación de la tarea 7.2

- [x] Gate documentado (A local / B entorno / C smoke / D QA)
- [x] Orden explícito respecto a 7.1 y al checklist QA
- [x] Matriz de decisión ante fallos de stock
- [ ] **Ejecución** de Gates A–C (pendiente del equipo — no es código)

**7.2 como artefacto:** listo.  
**7.2 como ejecución:** se marca al completar el registro de la sección 3.
