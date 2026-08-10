# Tarea 6.4 — Reactividad del panel tras confirm/reject

**Estado:** HECHO  
**Fecha:** 2026-08-10  
**Depende de:** 5.1 / 5.2 / 6.3  

## Objetivo

Tras una decisión de stock, la UI del panel debe mostrar `existence` / `reserved` / `available` actualizados **sin** depender de que el usuario abandone la vista o dispare un `syncAll` manual completo.

## Implementación

| Pieza | Comportamiento |
|-------|----------------|
| `productStore.refreshStockForProducts(ids)` | Re-lee cada producto (Appwrite → Dexie ya espejado en 6.3) y parchea `items`/`selected` |
| `productStore.patchLocalStock` | Parche en memoria si ya se conocen los valores |
| `saleStore.confirmSale` / `rejectSale` | Tras éxito, llama `refreshStockForProducts` con los `productId` del pedido |
| `SaleDetail` | Muestra `available ahora` por línea (reactivo a `$productStore`) |

## Cadena completa post-decisión

```text
Appwrite update (5.x)
  → Dexie put (6.3)
  → productStore items patch (6.4)
  → SaleDetail / ProductManagement reaccionan
```

## Criterio de aceptación

- [x] Confirm/reject disparan refresh de productos afectados
- [x] Detalle de venta muestra available reactivo
- [x] No obliga a `syncAll` de todo el catálogo para ver el cambio
