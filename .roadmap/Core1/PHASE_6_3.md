# Tarea 6.3 — Coherencia local post-decisión (cierre Fase 6)

**Estado:** HECHO  
**Fecha:** 2026-08-10  
**Depende de:** 5.1 / 5.2 / 6.1  
**No sustituye:** smoke 6.2 ni QA formal

## Problema

Tras confirm/reject, `applyStockDeltas` escribía solo en Appwrite. El panel sigue offline-first (Dexie). Hasta un `productStore.syncAll()` el listado de productos podía mostrar `reserved` / `existence` **viejos** (falso dato de stock en UI admin).

Clientes de tienda no dependen de Dexie del dash; el riesgo era solo **coherencia del panel**.

## Solución 6.3

Tras `updateDocument` exitoso en Appwrite:

1. `db.products.put(updated)` con el documento remoto (incluye `existence` y `reserved` nuevos).
2. Log `[stock][6.3] dexie mirror …`
3. Fallo de Dexie = warn best-effort; **no** revierte Appwrite (autoridad sigue siendo remota).

Autoridad de stock **sigue siendo Appwrite**. Dexie solo refleja.

## Criterio de aceptación

- [x] `applyStockDeltas` espeja en Dexie
- [x] Log de mirror documentado
- [x] Smoke 6.2 y QA siguen siendo los que validan semántica cruzada

## Relación con 6.1 / 6.2

| Tarea | Qué cierra |
|-------|------------|
| 6.1 | No segundo hold / no create B2C |
| 6.2 | Runbook smoke tienda → dash |
| **6.3** | Cache local del panel alineada tras mutación de stock |
