# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto desarrollo:** en alineación — Fase 0 hecha; Fase 1.1–1.2 hecha; **2.1 alta producto** hecha.

## Fase 0 — Baseline

| Tarea | Estado |
|-------|--------|
| 0.1 Reglas canónicas | **Hecho** |
| 0.2 Secretos | **Hecho** |
| 0.3 Inventario | **Hecho** |

## Fase 1 — Modelo stock

| Tarea | Estado |
|-------|--------|
| 1.1 `reserved` dominio | **Hecho** |
| 1.2 DTO + mapper | **Hecho** |
| 1.4–1.5 UI + no pisar reserved | **Hecho** |

## Fase 2 — Validaciones catálogo

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **2.1** Alta: existence ≥ 0, reserved = 0 | **Hecho** | `SaveProductCaseUse` + test unitario |
| **2.2** Edición: existence ≥ reserved | Pendiente (parcial en UI/repo update) |
| **2.3** Reserved no editable a mano | Pendiente formal |
| **2.4** Roles en catálogo | Fase 3 |
| **2.5** Status active/inactive | Base ya existe |

## Siguiente

**2.2** — endurecer path de edición (case use dedicado o ampliar update) para `existence >= reserved`.
