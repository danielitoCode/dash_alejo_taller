# Fase 7.3 — Definition of Done Core 1 (back-office) + hoja de ejecución QA

**Estado:** HECHO (DoD y hoja publicados)  
**Fecha:** 2026-08-10  
**Depende de:** 7.1 (alineación) · 7.2 (gate pre-QA)  
**Checklist detallado:** [`QA_CORE1_CHECK_plan.md`](./QA_CORE1_CHECK_plan.md)  
**Contrato:** [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md)

> **7.3** fija *cuándo* se puede decir “Core 1 dash cerrado” y una hoja corta para ejecutar el QA sin improvisar.  
> La ejecución de cada casilla sigue siendo manual en staging.

---

## 1. Definition of Done — Core 1 dash

Core 1 del panel está **cerrado** solo si se cumplen **todos** estos puntos:

| # | Condición | Evidencia |
|---|-----------|-----------|
| D1 | Alineación de código 7.1 aceptada | [`PHASE_7_1_ALIGNMENT_EXIT.md`](./PHASE_7_1_ALIGNMENT_EXIT.md) |
| D2 | Gate A (unit + check + build) PASS | Registro 7.2 |
| D3 | Smoke 6.2 caminos A y B PASS | [`SMOKE_6_2.md`](./SMOKE_6_2.md) registro |
| D4 | Checklist QA bloques **A, B, C, D, E** en verde | [`QA_CORE1_CHECK_plan.md`](./QA_CORE1_CHECK_plan.md) |
| D5 | Ningún fallo abierto de **semántica de stock** (existence/reserved/available) | Notas QA |
| D6 | `MVP_CORE1_STATUS.md` actualizado a “Core 1 dash cerrado” | Este repo |

**No basta** con tests unitarios o con “se ve bien en el panel”.

### Excepciones permitidas (no bloquean DoD)

- Deuda cosmética de UI (espaciado, copy) documentada.
- Support/promos fuera del soft-hold con bugs no críticos (bloque R del QA).
- Realtime ausente en dash (congelado: no obligatorio en Core 1).

### Excepciones **no** permitidas

- Confirm que no baja `existence` o `reserved`.
- Reject que baje `existence`.
- Crear venta B2C desde el panel.
- Editar `reserved` a mano en catálogo.
- Doble descuento de stock al re-confirmar.

---

## 2. Hoja de ejecución QA (orden sugerido)

Usar staging. Anotar fecha y ejecutor al final.

### Paso 0 — Preflight (7.2 Gate A+B)

```bash
npm run test:unit && npm run check && npm run build
```

- [ ] Gate A PASS  
- [ ] Entorno staging + IDs de producto anotados  

### Paso 1 — Smoke (7.2 Gate C / SMOKE_6_2)

- [ ] Camino A Confirm PASS  
- [ ] Camino B Reject PASS  
- [ ] Negativos N1–N3 PASS  

### Paso 2 — QA formal por bloques

Marcar en [`QA_CORE1_CHECK_plan.md`](./QA_CORE1_CHECK_plan.md):

| Bloque | Foco | Prioridad stock |
|--------|------|-----------------|
| **A** Auth/roles | Login, gates viewer/sales/admin | Media |
| **B** Catálogo | available, existence ≥ reserved, reserved RO | Alta |
| **C** Ventas | listado, currency, confirm/reject, idempotencia | **Crítica** |
| **D** Seguridad | sin `.env` trackeado, sin server key en browser | Alta |
| **E** E2E cruzado | tienda ↔ dash ↔ Appwrite | **Crítica** |
| **R** Regresión | support, promos, home | Baja |

### Paso 3 — Cierre documental

Si D1–D5 OK:

1. Actualizar `MVP_CORE1_STATUS.md` → **Core 1 dash cerrado** + fecha.  
2. Opcional: nota en `ALIGNMENT_WITH_ALEJOTALLER.md`.  
3. Solo entonces planear Core 2 / monorepo.

---

## 3. Registro de cierre (rellenar al terminar)

```text
Ejecutor: ____________________
Fecha inicio: ________________
Fecha fin: ___________________

Gate A:     PASS / FAIL
Smoke A/B:  PASS / FAIL
QA A:       PASS / FAIL / parcial
QA B:       PASS / FAIL / parcial
QA C:       PASS / FAIL / parcial
QA D:       PASS / FAIL / parcial
QA E:       PASS / FAIL / parcial
QA R:       PASS / FAIL / parcial

DoD Core 1 dash:  SÍ / NO
Incidencias abiertas (stock = bloqueo):
  -
Deuda no bloqueante:
  -
```

---

## 4. Criterio de aceptación de la tarea 7.3

- [x] DoD explícito (D1–D6)
- [x] Excepciones permitidas vs no permitidas
- [x] Hoja de ejecución enlazada a smoke + QA checklist
- [x] Plantilla de registro de cierre
- [ ] Ejecución real del DoD (pendiente operativa del equipo)

**7.3 como artefacto:** listo.  
**Core 1 formal:** se declara solo cuando el registro de la §3 diga DoD = SÍ.
