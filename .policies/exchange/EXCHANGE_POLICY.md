# Política de tipo de cambio y moneda (Exchange)

Última actualización: 2026-08-28  
Ámbito: **dash Core 3** (compras / abastecimiento) + paridad de tasa con AlejoTaller  
Canónico tasa (fetch): `AlejoTaller` feature `exchange` (misma API)  
Complementa: [PRODUCT_POLICY](../product/PRODUCT_POLICY.md), roadmap `POLICY_CURRENCY_CORE3.md`

---

## 1. Principio general

> **USD es la moneda referencial del negocio.**  
> Precios de venta (`product.price`), costos de inventario (`product.last_unit_cost`) y COGS se interpretan **siempre en USD**.  
> **CUP es solo moneda de pago de la factura de entrada**, no moneda de costo ni de catálogo.  
> La conversión CUP → USD usa la **tasa del momento del registro** y queda **congelada** (snapshot). Nunca se reescribe el historial con tasas futuras.

Objetivo: proteger márgenes frente a atraso de tasa, conversión incorrecta o compra por encima del precio de lista.

---

## 2. Fuente de tasa (paridad AlejoTaller)

| Aspecto | Valor |
|---------|--------|
| API | `https://widgets.directoriocubano.info/api/tasas` (override env `VITE_DIRECTORIO_CUBANO_API_URL`) |
| Campo | `tasas.USD.CUP` → **CUP por 1 USD** (ej. 350) |
| Fuente auditada | `DIRECTORIO_CUBANO` |
| Patrón | Offline-first opcional (cache del día) + fetch al usar |
| Conversión | `unitCostUSD = unitCostCUP / exchange_rate` |

Misma convención y API que el módulo `exchange` de AlejoTaller (web + Android). No inventar otra fuente en el panel.

---

## 3. Definiciones

| Término | Definición |
|---------|------------|
| Moneda de factura | `purchase_entry.currency`: `USD` \| `CUP` |
| Costo de línea (factura) | `unit_cost` / `line_cost` / `total_cost` en la unidad de `currency` |
| Costo referencial | `product.last_unit_cost`: **siempre USD** |
| Precio de venta | `product.price`: **siempre USD** |
| Tasa | CUP por 1 USD en el instante del registro |
| Snapshot | `exchange_rate` + `exchange_rate_at` + `exchange_rate_source` en la cabecera de la entrada; inmutable |
| Markup de protección | `1.30` (30 % sobre costo unitario USD) |

---

## 4. Escenarios de compra

### 4.1 Compra en USD (camino normal / default)

1. UI y dominio defaultan a **USD**.
2. Costos de línea en USD.
3. `currency = "USD"`; campos de tasa vacíos / no aplicables.
4. Si `concept = purchase` y `unitCost > 0` → `last_unit_cost = unitCost` (USD).
5. No se consulta la API de cambio.
6. Se evalúa **protección de precio** (§5) sobre el costo USD.

### 4.2 Compra en CUP (camino excepcional)

1. Staff elige **CUP** de forma explícita.
2. Costos de línea en **CUP**.
3. Al registrar:
   - Obtener tasa del momento (API; ver §6 si falla).
   - Preview: tasa, equivalente USD por línea, y si aplica aviso de protección de precio.
   - Persistir `currency = "CUP"`, montos en CUP, **snapshot de tasa**.
   - Por cada línea `purchase` con `unitCost > 0`:  
     `last_unit_cost = unitCostCUP / exchange_rate` (USD).
4. **Prohibido** persistir `last_unit_cost` en CUP.
5. **Prohibido** registrar CUP sin tasa válida (API o manual justificada).
6. Se evalúa **protección de precio** (§5) sobre el costo ya convertido a USD.

### 4.3 Qué no se hace nunca

| Prohibición | Motivo |
|-------------|--------|
| Default moneda = CUP | Camino feliz es USD |
| Mezclar monedas en una misma factura | Una factura = una `currency` |
| Recalcular `last_unit_cost` histórico con tasa nueva | Snapshot inmutable |
| Tasa “de memoria” sin snapshot | Auditoría rota |
| Alterar `existence` / `reserved` por moneda | Soft-hold intocable |
| Guardar precio de venta en CUP en `product.price` | Catálogo siempre USD |

---

## 5. Protección de precio de venta (anti-pérdida)

### 5.1 Regla

Tras calcular el **costo unitario en USD** de una línea con `concept = purchase` y `unitCostUSD > 0`:

```text
si unitCostUSD > product.price actual:
  → product.price = unitCostUSD × 1.30
  → marcar producto (señal durable: price_protected_at / entry_id o equivalente UI)
```

- Solo **sube** el precio; nunca lo baja por esta regla.
- Aplica tanto a compras USD como CUP (sobre el costo ya en USD).
- No bloquea el registro de la factura.

### 5.2 UX obligatoria

| Momento | Comportamiento |
|---------|----------------|
| **Antes de confirmar** (modal factura) | Preview: lista de ítems cuyo precio se ajustará, costo USD, precio actual, precio nuevo (+30 %) |
| **Tras confirmar** | Resumen de productos tocados |
| **En el producto** | Badge / indicador visible de que el precio fue auto-ajustado por protección; staff puede editar manualmente después |

### 5.3 Qué no hace la protección

- No crea una segunda moneda en catálogo.
- No recalcula precios de otros productos.
- No exige confirmación extra del usuario más allá del preview (protección automática inicial).
- No toca stock ni soft-hold.

---

## 6. Fallo de API y tasa manual

| Situación | Acción |
|-----------|--------|
| API OK | Usar tasa; `exchange_rate_source = DIRECTORIO_CUBANO` |
| API falla / timeout | **No registrar CUP a ciegas.** Reintentar o **tasa manual** solo owner/admin, con nota/motivo obligatorio y `source = manual` |
| Tasa ≤ 0 o no finita | Rechazar |

La tasa manual es excepción operativa, no el camino normal. Debe quedar auditada en el snapshot.

---

## 7. Auditoría mínima

Toda entrada **CUP** debe permitir reconstruir:

- montos pagados en CUP,
- tasa exacta, momento y fuente,
- USD resultante que alimentó `last_unit_cost`,
- si se aplicó protección de precio y a qué productos.

Entradas **USD**: no requieren snapshot de tasa; sí deben dejar traza si hubo protección de precio.

---

## 8. Relación con COGS, operador y catálogo

- Al VERIFIED, COGS = `last_unit_cost × qty` (USD), sin cambio respecto a Core 2.
- El operador **no** conoce CUP ni la tasa de la compra.
- `product.price` y `last_unit_cost` siguen en USD para tienda y operador.
- Un `last_unit_cost` mal convertido distorsiona el margen de **todas** las ventas posteriores de ese SKU hasta la siguiente compra correcta → el punto de control es el registro de la entrada.

---

## 9. Roles

| Acción | Roles |
|--------|--------|
| Registrar compra USD | owner / admin (mismo gate Compras) |
| Registrar compra CUP + tasa API | owner / admin |
| Registrar compra CUP + tasa manual | solo owner / admin |
| Ver historial moneda/tasa / protección | owner / admin |
| sales / operator / cliente | sin escritura de compras |

---

## 10. Schema (atributos)

### `purchase_entry` (requerido para CUP)

| Atributo | Tipo | Notas |
|----------|------|--------|
| `exchange_rate` | double | CUP por 1 USD; solo si currency = CUP |
| `exchange_rate_at` | datetime / string ISO | momento del snapshot |
| `exchange_rate_source` | string | `DIRECTORIO_CUBANO` \| `manual` |

### `product` (recomendado para protección)

| Atributo | Tipo | Notas |
|----------|------|--------|
| `price_protected_at` | datetime / string ISO | opcional; cuándo se auto-ajustó |
| `price_protection_entry_id` | string | opcional; traza a la entrada |

Si aún no existen en Appwrite: documentar gap y usar UI + notes de entrada hasta migrar.

---

## 11. Invariantes (capa de dominio / tests)

1. `last_unit_cost` **nunca** se persiste en CUP.
2. `product.price` **nunca** se persiste en CUP.
3. Toda factura `currency = CUP` tiene snapshot de tasa con `exchange_rate > 0`.
4. Default de moneda en registro de compra = **USD**.
5. Fallo de tasa sin manual justificada → rechazo de entrada CUP.
6. Si `unitCostUSD > price` en línea purchase → `price = unitCostUSD * 1.30` y señal de protección.
7. Soft-hold (`existence` / `reserved`) no se altera por reglas de moneda ni de precio.
8. Una factura = una sola `currency`.

---

## 12. Fuera de alcance

- Multi-moneda de precios en catálogo B2C (cliente usa switch de display sobre precio USD).
- FIFO por lote en divisa.
- Contabilidad formal de diferencias de cambio.
- Anulación B3 de entradas (si se anula, no reescribir tasas de otras entradas).

---

## 13. Checklist

- [ ] Default USD en UI y dominio de compra
- [ ] Selector USD \| CUP; preview de tasa y USD equivalente si CUP
- [ ] Snapshot tasa en `purchase_entry` al registrar CUP
- [ ] `last_unit_cost` siempre USD tras conversión
- [ ] Protección +30 % con preview pre-confirm y badge en producto
- [ ] Tasa manual solo owner/admin + motivo
- [ ] Atributos Appwrite (o gap documentado)
- [ ] Tests de dominio: conversión, rechazo sin tasa, protección precio, no tocar stock

> Fecha: 2026-08-28  
> Rama: Core3
