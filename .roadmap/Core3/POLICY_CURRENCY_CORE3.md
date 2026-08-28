# Core 3 — Política de moneda (USD / CUP)

**Fecha:** 2026-08-28  
**Rama:** `Core3`  
**Estado:** propuesta aceptada para implementación (código = paso siguiente)  
**Objetivo:** proteger márgenes y COGS frente a pérdida por atraso o mala conversión CUP → USD.

Complementa [`POLICY_PURCHASE_CORE3.md`](./POLICY_PURCHASE_CORE3.md). No altera soft-hold ni el flujo de venta del operador.

---

## 1. Principios

1. **USD es la moneda principal y referencial del negocio.**  
   Precios de venta, COGS, `product.last_unit_cost` y finanzas de margen se interpretan en **USD**.

2. **CUP es solo moneda de pago de la factura**, no moneda de costo de inventario.  
   Se usa únicamente cuando la compra real se liquidó en pesos cubanos.

3. **El costo de inventario no se reescribe con tasas futuras.**  
   La conversión CUP → USD usa la **tasa del momento del registro** y queda congelada en esa entrada.

4. **Sin tasa no hay compra en CUP.**  
   No se permite registrar una entrada `currency = CUP` sin tasa válida (API o, en excepción controlada, tasa manual obligatoria con justificación).

5. **La mayoría del abastecimiento es USD.**  
   El camino por defecto en UI y dominio es USD (sin consulta de tasa).

---

## 2. Definiciones

| Término | Definición |
|---------|------------|
| **Moneda de factura** | `purchase_entry.currency`: `USD` o `CUP` (la del pago real). |
| **Costo de línea en moneda de factura** | `unit_cost` / `line_cost` / `total_cost` en la misma unidad que `currency`. |
| **Costo referencial de producto** | `product.last_unit_cost`: **siempre USD**. |
| **Tasa de cambio** | Cantidad de **CUP por 1 USD** en el instante de registrar la factura (ej. 350 = 1 USD vale 350 CUP). |
| **Conversión** | `unitCostUSD = unitCostCUP / exchange_rate` (con tasa en CUP/USD). |
| **Snapshot de tasa** | Tasa + momento + fuente guardados en la cabecera de la entrada; no se recalculan después. |

---

## 3. Reglas por escenario

### 3.1 Compra en USD (camino normal)

- Staff selecciona **USD** (default).
- Costos de línea se introducen en USD.
- Se persiste `currency = "USD"`.
- Campos de tasa: **vacíos / no aplicables**.
- Si `concept = purchase` y `unitCost > 0` → `last_unit_cost = unitCost` (USD).
- No se consulta API de cambio.

### 3.2 Compra en CUP (camino excepcional)

- Staff selecciona **CUP** de forma explícita.
- Costos de línea se introducen en **CUP**.
- En el momento del registro:
  1. Se obtiene la **tasa de mercado del momento** (API oficial del negocio).
  2. Se muestra preview al staff: tasa usada y equivalente aproximado en USD por línea.
  3. Se persiste la entrada con:
     - `currency = "CUP"`
     - montos en CUP (`unit_cost`, `line_cost`, `total_cost`)
     - **snapshot de tasa** (ver §5)
  4. Para cada línea `purchase` con `unitCost > 0`:
     - `last_unit_cost = unitCostCUP / exchange_rate` (USD, redondeo acordado, p. ej. 4–6 decimales o 2 según política contable).
- **Prohibido** guardar `last_unit_cost` en CUP.
- **Prohibido** registrar CUP si la tasa no se pudo obtener y no hay tasa manual justificada (ver §4).

### 3.3 Qué no se hace nunca

- No defaultar moneda a CUP.
- No mezclar en una misma factura líneas en monedas distintas (una factura = una `currency`).
- No recalcular `last_unit_cost` de entradas pasadas cuando cambia el mercado.
- No usar una tasa “de memoria” o de otro día sin dejar snapshot.
- No alterar `existence` / `reserved` por temas de moneda.

---

## 4. Fallo de API y tasa manual

| Situación | Acción |
|-----------|--------|
| API OK | Usar tasa de API; guardar fuente = API. |
| API falla / timeout | **No registrar a ciegas.** Opciones: reintentar, o **tasa manual obligatoria** solo owner/admin, con nota obligatoria (motivo) y fuente = `manual`. |
| Tasa ≤ 0 o no finita | Rechazar. |

La tasa manual es excepción de continuidad operativa, no el camino normal. Debe quedar auditada.

---

## 5. Auditoría mínima (protección del negocio)

Toda entrada en **CUP** debe permitir reconstruir:

- montos pagados en CUP,
- tasa exacta usada,
- cuándo se consultó/aplicó,
- de dónde salió (API o manual),
- el USD resultante que alimentó `last_unit_cost`.

Con eso se puede:

- explicar COGS en disputas internas,
- medir atraso operativo (tasa usada vs mercado del mismo día, reporte opcional),
- evitar que un error de cambio “desaparezca” en el historial.

Entradas **USD** no requieren snapshot de tasa.

---

## 6. Relación con COGS y operador

- Al VERIFIED, COGS sigue siendo `last_unit_cost × qty` (USD), igual que Core 2.
- El operador **no** necesita conocer CUP ni la tasa.
- Si `last_unit_cost` queda mal (p. ej. se guardó CUP por error), el margen se distorsiona en **todas** las ventas posteriores de ese SKU hasta la siguiente compra que lo corrija.

Por eso la conversión al registrar la entrada es el punto de control único.

---

## 7. Roles

| Acción | Roles |
|--------|--------|
| Registrar compra USD | owner / admin (mismo gate que Compras hoy) |
| Registrar compra CUP + tasa API | owner / admin |
| Registrar compra CUP + tasa manual | solo owner / admin |
| Ver historial y moneda/tasa | owner / admin |
| sales / operator / cliente | sin acceso a compras (política nav B4) |

---

## 8. Criterio de “negocio protegido”

Se considera cumplida la política cuando:

1. `last_unit_cost` **nunca** se persiste en CUP.
2. Toda factura CUP tiene snapshot de tasa inmutable.
3. Default y camino feliz son USD.
4. Fallo de tasa no permite entrada CUP opaca.
5. El historial muestra la moneda real de la factura sin mentir.

---

## 9. Fuera de alcance (esta política)

- Multi-moneda en ventas al cliente (sigue el modelo actual de precios).
- FIFO por lote en divisa.
- Cobertura cambiaria o contabilidad de diferencias de cambio formal (puede ser reporte futuro).
- Anulación B3 de entradas (si se anula, la política de moneda se mantiene: no reescribir tasas de otras entradas).

---

## 10. Schema — cambios requeridos

Ver sección siguiente en el mensaje de cierre / checklist de implementación.
