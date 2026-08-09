# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto desarrollo:** en alineación — Fase 2 catálogo **2.1–2.3 hechos**.

## Fase 0–1

| Área | Estado |
|------|--------|
| 0.1–0.3 baseline | **Hecho** |
| 1.x reserved + mapper + UI stock | **Hecho** |

## Fase 2 — Validaciones catálogo

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| **2.1** Alta: existence ≥ 0, reserved = 0 | **Hecho** | `SaveProductCaseUse` |
| **2.2** Edición: existence ≥ reserved | **Hecho** | `UpdateProductCatalogCaseUse` |
| **2.3** Reserved no editable a mano | **Hecho** | UI readonly + case use omite reserved + create fuerza 0 |
| **2.4** Roles en catálogo | Fase 3 |
| **2.5** Status active/inactive | Base OK |

## Capas 2.3 (defensa en profundidad)

1. **UI:** sin input editable de reserved; en edición solo lectura + disponible calculado  
2. **Case use alta:** `reserved = 0`  
3. **Case use edición:** no incluye reserved en el patch; re-lee reserved remoto  
4. **Repo:** `productToCatalogWriteDTO` no envía reserved a Appwrite  

## Siguiente

**Fase 3** — gates de roles (`ROLE_ROUTE_ACCESS`, UserManagement), o **2.4/2.5** si se quiere cerrar catálogo antes de auth.
