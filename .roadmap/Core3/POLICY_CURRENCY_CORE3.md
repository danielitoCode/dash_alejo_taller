# Core 3 — Política de moneda y protección de margen (USD / CUP)

**Fecha:** 2026-08-28  
**Rama:** `Core3`  
**Estado:** propuesta coherente para implementación (código = paso siguiente)  
**Objetivo:** proteger márgenes y COGS frente a (1) pérdida por atraso o mala conversión CUP→USD y (2) vender por debajo del nuevo costo de compra.

Complementa [`POLICY_PURCHASE_CORE3.md`](./POLICY_PURCHASE_CORE3.md).  
**No altera** soft-hold (`existence`/`reserved`), ni el flujo de venta del operador, ni el COGS = `last_unit_cost × qty` al VERIFIED.

---

## 1. Principios

1. **USD es la moneda principal y referencial del negocio.**  
   Precios de venta (`product.price`), COGS, `product.last_unit_cost` y finanzas de margen se interpretan en **USD**.

2. **CUP es solo moneda de pago de la factura**, no moneda de costo de inventario.  
   Se usa únicamente cuando la compra real se liquidó en pesos cubanos.

3. **El costo de inventario no se reescribe con tasas futuras.**  
   La conversión CUP → USD usa la **tasa del momento del registro** y queda congelada (snapshot) en esa entrada.

4. **Sin tasa válida no hay compra en CUP.**  
   No se permite registrar `currency = CUP` sin tasa válida (API o, en excepción controlada, tasa manual obligatoria con justificación).

5. **La mayoría del abastecimiento es USD.**  
   El camino por defecto en UI y dominio es USD (sin consulta de tasa).

6. **Protección de precio de venta (anti-pérdida).**  
   Si el nuevo costo unitario en USD de una línea de compra supera el precio de venta actual del producto, el sistema **recalcula automáticamente** el precio de venta a **+30 % sobre el costo de compra** y deja constancia visible para el staff. Es una protección inicial; el usuario puede ajustar después.

---

## 2. Definiciones

| Término | Definición |
|---------|------------|
| **Moneda de factura** | `purchase_entry.currency`: `USD` o `CUP` (la del pago real). |
| **Costo de línea en moneda de factura** | `unit_cost` / `line_cost` / `total_cost` en la misma unidad que `currency`. |
| **Costo referencial de producto** | `product.last_unit_cost`: **siempre USD**. |
| **Precio de venta** | `product.price`: **siempre USD**. |
| **Tasa de cambio** | Cantidad de **CUP por 1 USD** en el instante de registrar la factura (ej. 350 → 1 USD = 350 CUP). |
| **Conversión** | `unitCostUSD = unitCostCUP / exchange_rate` (tasa en CUP/USD). |
| **Snapshot de tasa** | Tasa + momento + fuente guardados en la cabecera de la entrada; **inmutable**. |
| **Markup de protección** | 30 % sobre el costo unitario USD de la compra (`newPrice = unitCostUSD × 1.30`). |

---

## 3. Estrategia de tasa de cambio (alineada a AlejoTaller)

Se aplica **la misma estrategia** que el monorepo AlejoTaller para consultas de cambio:

| Aspecto | Valor |
|---------|--------|
| **Fuente canónica** | API Directorio Cubano: `https://widgets.directoriocubano.info/api/tasas` (o env `VITE_DIRECTORIO_CUBANO_API_URL` / equivalente en dash) |
| **Payload relevante** | `tasas.USD.CUP` → CUP por 1 USD (`usdReference`) |
| **Fuente auditada** | `DIRECTORIO_CUBANO` |
| **Momento** | En el **registro de la factura** (no al editar historial, no retroactivo) |
| **Cache / offline** | Misma lógica offline-first que AlejoTaller cuando exista cache del día; si no hay tasa del día usable → fallar o forzar manual (ver §5) |
| **Formato de tasa** | Número positivo; `unitCostUSD = unitCostCUP / tasa` |

**Prohibido:**

- Usar tasa “de memoria”, de otro día, o de otra fuente sin dejar snapshot.
- Recalcular entradas pasadas cuando el mercado se mueva.

---

## 4. Reglas por escenario de compra

### 4.1 Compra en USD (camino normal)

- Staff selecciona **USD** (default).
- Costos de línea en USD.
- `currency = "USD"`; campos de tasa **vacíos / no aplicables**.
- Si `concept = purchase` y `unitCost > 0` → `last_unit_cost = unitCost` (USD).
- **No** se consulta API de cambio.
- Se evalúa la **protección de precio** (§6) con ese `unitCost` USD.

### 4.2 Compra en CUP (camino excepcional)

- Staff selecciona **CUP** de forma explícita.
- Costos de línea en **CUP**.
- En el momento del registro:
  1. Se obtiene la **tasa de mercado del momento** (misma API/estrategia que AlejoTaller).
  2. UI muestra preview: tasa usada, fuente, equivalente aproximado en USD por línea, y **aviso de protección de precio** si aplica.
  3. Se persiste la entrada con:
     - `currency = "CUP"`
     - montos en CUP (`unit_cost`, `line_cost`, `total_cost`)
     - **snapshot de tasa** (ver §7)
  4. Para cada línea `purchase` con `unitCost > 0`:
     - `last_unit_cost = unitCostCUP / exchange_rate` (USD; redondeo acordado, p. ej. 4–6 decimales o 2 según política contable).
  5. Se evalúa la **protección de precio** (§6) con el `unitCostUSD` resultante.
- **Prohibido** guardar `last_unit_cost` en CUP.
- **Prohibido** registrar CUP si la tasa no se pudo obtener y no hay tasa manual justificada (§5).

### 4.3 Qué no se hace nunca

- No defaultar moneda a CUP.
- No mezclar monedas distintas en una misma factura (una factura = una `currency`).
- No recalcular `last_unit_cost` de entradas pasadas por cambio de mercado.
- No alterar `existence` / `reserved` por temas de moneda o de precio.
- No silenciar la protección de precio cuando el costo supera el precio de venta.

---

## 5. Fallo de API y tasa manual

| Situación | Acción |
|-----------|--------|
| API OK | Usar tasa de API; `exchange_rate_source = DIRECTORIO_CUBANO`. |
| API falla / timeout / tasa no usable | **No registrar a ciegas.** Opciones: reintentar, o **tasa manual obligatoria** solo owner/admin, con nota obligatoria (motivo) y `exchange_rate_source = manual`. |
| Tasa ≤ 0 o no finita | Rechazar. |

La tasa manual es excepción de continuidad operativa, no el camino normal. Debe quedar auditada.

---

## 6. Protección de precio de venta (salvedad anti-pérdida)

### 6.1 Condición

Para cada línea con `concept = purchase` y `unitCostUSD > 0`:

```
si unitCostUSD > product.price (precio de venta actual en USD)
entonces aplicar protección
```

Comparación siempre en USD (tras conversión si la factura fue CUP).

### 6.2 Acción automática

1. Calcular `newSalePrice = unitCostUSD × 1.30` (markup fijo **30 %**).
2. Actualizar `product.price = newSalePrice`.
3. Dejar **señal visible** en el producto de que el precio fue ajustado por protección de compra (ver §6.4).
4. Registrar en la respuesta del case use / UI qué productos se ajustaron (para el resumen post-factura).

### 6.3 UX en el momento de la factura

- **Antes de confirmar** (preview): si alguna línea disparará la protección, informar explícitamente:  
  *“El costo de [producto] supera el precio de venta actual. Al confirmar se ajustará el precio de venta a costo + 30 %. Podrás revisarlo y editarlo después.”*
- **Tras confirmar**: resumen de productos cuyo precio se actualizó (antiguo → nuevo).
- El staff **no bloquea** el registro de la factura por este motivo; la protección es automática para no dejar el negocio expuesto a vender bajo costo.

### 6.4 Señal en el ítem de producto

Objetivo: que el usuario vea **que este fenómeno ocurrió** y pueda actuar después.

Opciones mínimas (implementación puede combinar):

| Mecanismo | Descripción |
|-----------|-------------|
| **Flag / metadata** | Campo opcional en `product` (ej. `price_protected_at` ISO o `price_protection_note`) o evento de auditoría ligado al `entry_id`. |
| **UI producto** | Badge o aviso en ficha/listado: “Precio ajustado por compra (costo > precio)” con fecha o enlace a la entrada. |
| **Historial** | El detalle de la factura de entrada lista los productos cuyo `price` se modificó por esta regla. |

La señal debe ser **consultable** después; no solo un toast efímero.

### 6.5 Qué no hace la protección

- No modifica precios de productos cuyas líneas no superan el precio actual.
- No aplica a `concept` distintos de `purchase` (royalty/other).
- No recalcula precios de otras entradas ni de ventas ya hechas.
- No impide que el staff baje o suba el precio **después** de forma manual (UpdateProductPrice / catálogo).

---

## 7. Auditoría mínima (protección del negocio)

### 7.1 Entrada en CUP

Toda entrada **CUP** debe permitir reconstruir:

- montos pagados en CUP,
- tasa exacta usada,
- cuándo se consultó/aplicó,
- de dónde salió (API `DIRECTORIO_CUBANO` o `manual`),
- el USD resultante que alimentó `last_unit_cost`.

### 7.2 Protección de precio

Toda aplicación de la regla §6 debe permitir reconstruir:

- producto afectado,
- precio anterior,
- precio nuevo (`unitCostUSD × 1.30`),
- costo USD que disparó la regla,
- entrada de compra asociada (`entry_id`),
- cuándo se aplicó.

Con esto se puede explicar COGS y cambios de lista en disputas internas y evitar que un error de cambio o un costo desactualizado “desaparezca” del historial.

Entradas **USD** sin disparo de protección no requieren snapshot de tasa.

---

## 8. Relación con COGS y operador

- Al VERIFIED, COGS sigue siendo `last_unit_cost × qty` (USD), igual que Core 2.
- El operador **no** necesita conocer CUP ni la tasa.
- El cliente B2C ve el `price` actualizado (si se aplicó protección) en el catálogo como cualquier otro cambio de precio.
- Si `last_unit_cost` quedara mal (p. ej. se guardó CUP por error), el margen se distorsiona en **todas** las ventas posteriores de ese SKU hasta la siguiente compra que lo corrija — por eso la conversión al registrar es el punto de control único.

---

## 9. Roles

| Acción | Roles |
|--------|--------|
| Registrar compra USD | owner / admin (mismo gate que Compras hoy) |
| Registrar compra CUP + tasa API | owner / admin |
| Registrar compra CUP + tasa manual | solo owner / admin |
| Ver historial, moneda, tasa y ajustes de precio por protección | owner / admin |
| Editar precio de venta después (manual) | según política de catálogo existente |
| sales / operator / cliente | sin acceso a compras (política nav B4) |

---

## 10. Criterio de “negocio protegido”

Se considera cumplida la política cuando:

1. `last_unit_cost` **nunca** se persiste en CUP.
2. Toda factura CUP tiene snapshot de tasa inmutable (API Directorio Cubano o manual auditada).
3. Default y camino feliz son USD.
4. Fallo de tasa no permite entrada CUP opaca.
5. Si costo USD > precio de venta → precio se ajusta a **costo × 1.30** y queda señal visible en el producto / historial.
6. El historial muestra la moneda real de la factura y los ajustes de precio por protección sin mentir.
7. Soft-hold y flujo de venta del operador no se alteran.

---

## 11. Schema — cambios requeridos / recomendados

### 11.1 `purchase_entry` (cabecera) — requeridos para CUP

| Atributo | Tipo | Required | Notas |
|----------|------|----------|--------|
| `exchange_rate` | double | no | CUP por 1 USD; solo si `currency = CUP` |
| `exchange_rate_at` | datetime / string ISO | no | Momento de la tasa |
| `exchange_rate_source` | string | no | `DIRECTORIO_CUBANO` \| `manual` |

(`currency` ya existe.)

### 11.2 `product` — recomendados para señal de protección

| Atributo | Tipo | Required | Notas |
|----------|------|----------|--------|
| `price_protected_at` | datetime / string ISO | no | Última vez que se aplicó §6; se actualiza en cada disparo |
| `price_protection_entry_id` | string | no | Última `purchase_entry` que disparó el ajuste (opcional pero útil para traza) |

Alternativa sin atributos nuevos: solo UI + auditoría en detalle de entrada / log de case use, si se acepta trazabilidad más débil.

### 11.3 Sin cambios

- `existence` / `reserved` / soft-hold.
- Fórmula COGS del operador.
- Estructura de líneas de compra más allá de moneda/tasa en cabecera.

---

## 12. Fuera de alcance (esta política)

- Multi-moneda en ventas al cliente (sigue el modelo actual de precios en USD de catálogo + display CUP en tienda vía tasa de AlejoTaller).
- FIFO por lote en divisa.
- Cobertura cambiaria o contabilidad formal de diferencias de cambio (puede ser reporte futuro).
- Anulación B3 de entradas (si se anula, no reescribir tasas ni precios de otras entradas; política de compensación de stock sigue B3).
- Markup variable por categoría (fijo 30 % en esta versión).

---

## 13. Orden de implementación sugerido (código)

1. Snapshot de tasa + conversión CUP→USD en `RegisterPurchaseEntryCaseUse` (misma API que AlejoTaller).
2. Preview de tasa y de protección de precio en modal de factura.
3. Aplicar §6 al confirmar (actualizar `price` + señal en producto).
4. UI de producto: badge/aviso de precio protegido.
5. Schema Appwrite (§11) en consola + mappers.

---

**Resumen ejecutivo:** USD por defecto; CUP solo con tasa del momento (Directorio Cubano, igual que AlejoTaller) congelada en snapshot; si el costo de compra en USD supera el precio de venta, el sistema sube el precio a costo + 30 % y lo deja señalado para que el negocio no venda a pérdida por precios desactualizados.
