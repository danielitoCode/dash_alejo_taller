# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto desarrollo:** en alineación — **2.1 y 2.2** hechos.

## Fase 0 — Baseline

| Tarea | Estado |
|-------|--------|
| 0.1–0.3 | **Hecho** |

## Fase 1 — Modelo stock

| Tarea | Estado |
|-------|--------|
| 1.1–1.2 reserved + mapper | **Hecho** |
| 1.4–1.5 UI + no pisar reserved | **Hecho** |

## Fase 2 — Validaciones catálogo

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **2.1** Alta: existence ≥ 0, reserved = 0 | **Hecho** | `SaveProductCaseUse` |
| **2.2** Edición: existence ≥ reserved | **Hecho** | `UpdateProductCatalogCaseUse` (re-read reserved) + tests |
| **2.3** Reserved no editable a mano | Parcial | case use no acepta reserved en patch; UI sin input reserved |
| **2.4** Roles catálogo | Fase 3 |
| **2.5** Status | Base OK |

## Siguiente

**2.3** (formalizar UI read-only reserved si falta) o **Fase 3** gates de roles.
