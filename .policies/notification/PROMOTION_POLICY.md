# Política de promociones — Política B (canónica)

**Estado:** aceptada (2026-08-13)  
**Ámbito:** back-office (`dash_alejo_taller`) + tienda web + Android (`AlejoTaller`)  
**Rama de trabajo de política:** `policy/promotions-b` → PR a `master`  
**No altera** soft-hold Core 1 (`existence` / `reserved` / `available`).

---

## 1. Principio

> El **precio de lista** del producto (`product.price`) es estable.  
> El **precio de venta efectivo** lo resuelve una promoción activa (si existe).  
> No se “pisa” el catálogo como única verdad al activar una oferta.

```text
effectivePrice(product) =
  promo product_discount ACTIVA para product.id  →  promo.promoPrice
  si no                                          →  product.price
```

Las ventas **congelan** el importe en el momento del pedido (UNVERIFIED).  
Cambiar o terminar una promo **no recalcula** ventas ya creadas.

---

## 2. Tipos de promoción

| Tipo (`kind`) | `productId` | Efecto en precio |
|---------------|-------------|------------------|
| **`product_discount`** | **Obligatorio** | Define oferta sobre un producto |
| **`banner`** | **Null / ausente** | Solo comunicación (imagen, título, mensaje). **No** cambia precio |

- Promos **solo banner, sin producto:** permitidas.
- Una promo no puede ser a la vez descuento de producto y banner ambiguo: el `kind` es discriminante.

---

## 3. Regla de unicidad

> **Como máximo una** promo `product_discount` **activa** por `productId` en un instante dado.

- Si el staff intenta activar otra sobre el mismo producto mientras hay una activa → **rechazar** (o exigir cancelar/terminar la anterior).
- Varias `banner` pueden coexistir (límite UX a criterio del panel; no es restricción de stock).
- “Activa” = `status` compatible con vigente **y** `now ∈ [validFrom, validUntil]` (ver §5).

---

## 4. Campos y validaciones (`product_discount`)

| Campo | Regla |
|-------|--------|
| `productId` | Obligatorio; debe existir en catálogo |
| `oldPrice` | `> 0`; al crear, default recomendado = `product.price` (lista) |
| `promoPrice` (`currentPrice`) | `≥ 0` y **`promoPrice < oldPrice`** |
| Descuento % | **Derivado** (no fuente de verdad): `((oldPrice - promoPrice) / oldPrice) * 100` |
| `validFromEpochMillis` / `validUntilEpochMillis` | `validFrom ≤ validUntil` |
| `title` / `message` | Requeridos (comunicación) |
| `imageUrl` | Opcional |
| `source` | `manual` \| `automatic` (panel: normalmente `manual`) |

### Banner

| Campo | Regla |
|-------|--------|
| `productId` | Null |
| `oldPrice` / `promoPrice` | Opcionales / ignorados para precio efectivo |
| Resto de comunicación | Igual que arriba |

---

## 5. Ciclo de vida

| Estado | Significado |
|--------|-------------|
| `draft` | Opcional; no aplica en tienda |
| `active` | Puede aplicar si la ventana de fechas contiene `now` |
| `ended` | Cerrada por fecha o cierre automático |
| `cancelled` | Cierre manual anticipado; deja de aplicar al instante |

**Precio efectivo** solo si:

```text
kind == product_discount
AND status no es cancelled/ended/draft
AND now >= validFrom AND now <= validUntil
AND es la única elegible (regla §3)
```

Cancelar en panel → deja de aplicar **sin** mutar `product.price`.

---

## 6. Qué no hace una promoción

- No modifica `existence` ni `reserved`.
- No crea ni confirma ventas.
- No recalcula `amount` de ventas pasadas.
- No es la base de COGS (Core 2: COGS = último costo × qty al VERIFIED).
- No sustituye el catálogo: `product.price` sigue siendo precio de lista.

---

## 7. Superficies

### Back-office

1. Crear `product_discount`: elegir producto → autocompletar `oldPrice` → capturar `promoPrice` o % → fechas → guardar.
2. Validar unicidad (§3) antes de persistir/activar.
3. Crear `banner` sin producto.
4. Listar activas / programadas / vencidas; cancelar.
5. Preview de % descuento en UI.

### Tienda web y Android

1. Cargar promos activas (query + realtime).
2. En catálogo/detalle: si hay `product_discount` activa → mostrar tachado `oldPrice` + precio `promoPrice` + badge %.
3. Checkout: línea con **effectivePrice**; el `Sale` persiste ese monto.
4. Banners: UI de avisos/carrusel; sin efecto en precio.

### Operador / confirmación de venta

- Trabaja con el `amount` ya guardado en la venta.  
- No reinterpreta promociones en el confirm/reject.

---

## 8. Realtime (canónico: Appwrite)

**Fuente de verdad:** collection Appwrite `promotions`.

**Canal realtime (clientes y panel):**

```text
databases.{DATABASE_ID}.collections.promotions.documents
```

Eventos Appwrite (`create` / `update` / `delete`) → invalidar caché local de promos → recalcular `effectivePrice` en UI.

| Antes (legado) | Ahora (política) |
|----------------|------------------|
| Pusher / Pulse (`promotion:*`, `promotion.new`, …) | **Appwrite Realtime** sobre `promotions` |
| Eventos con nombres distintos web vs Android | Un solo canal de documentos Appwrite |

**Migración:**

1. Suscribir web y Android (y opcionalmente dash) al canal de collection `promotions`.
2. Dejar de depender de publish Pusher para promos nuevas.
3. Pusher puede quedar temporalmente como no canónico; no es requisito de esta política.
4. Fallback sin socket: `listDocuments` + filtros de fecha al abrir catálogo.

Permisos Appwrite: lectura de `promotions` activas para roles de tienda (y visitante si el catálogo es público); escritura solo staff del panel.

---

## 9. Collection `promotions` (atributos de política)

Campos ya usados + los que la política exige alinear:

| Atributo | Uso política B |
|----------|----------------|
| `productId` | Null en banner; obligatorio en product_discount |
| `title`, `message`, `imageUrl` | Comunicación |
| `oldPrice`, `currentPrice` | Lista de referencia y precio promo |
| `validFromEpochMillis`, `validUntilEpochMillis` | Ventana |
| `source` | manual / automatic |
| `kind` | **`product_discount` \| `banner`** (añadir si no existe; default: si hay productId → product_discount, si no → banner) |
| `status` | Opcional si se infiere por fechas + delete; recomendado para cancelación explícita |

Índice recomendado: `productId`, `validUntilEpochMillis` (y `kind` si se indexa).

---

## 10. Compatibilidad Core 1 / Core 2

| Tema | Regla |
|------|--------|
| Soft-hold | Intocable |
| `product.price` | Precio de **lista**; no es el mecanismo de oferta |
| Sale UNVERIFIED/VERIFIED | Importe ya capturado; promo no interviene en confirm |
| Core 2 finanzas | Margen sobre **cobrado** y **last_unit_cost**, no sobre precio tachado |

---

## 11. Criterios de aceptación (DoD política)

- [ ] Doc de política fusionada en `master` (este archivo + índice README)
- [ ] Dominio dash: helpers `effectivePrice` + validación unicidad + % descuento
- [ ] UI panel: crea product_discount y banner según reglas
- [ ] Web: effectivePrice + suscripción Appwrite RT a `promotions`
- [ ] Android: effectivePrice + suscripción Appwrite RT a `promotions`
- [ ] Una segunda promo activa al mismo producto es rechazada
- [ ] Cancelar promo restaura precio efectivo al de lista sin mutar historial de ventas

---

## 12. Decisiones de producto (cerradas 2026-08-13)

- [x] **Política B** (lista estable + precio efectivo)
- [x] **Una sola** `product_discount` activa por producto
- [x] **Banner sin producto** permitido
- [x] Realtime canónico: **Appwrite** (no Pusher) para promociones
