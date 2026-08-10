# Tarea 6.2 — Smoke cruzado tienda → dash (pre-QA)

**Estado del artefacto:** HECHO (runbook listo para ejecutar)  
**Estado de ejecución:** pendiente del operador / staging  
**No es QA formal:** es el puente de alineación para validar semántica de stock end-to-end.  
**QA completo:** `.roadmap/Core1/QA_CORE1_CHECK_plan.md` (después).

**Contrato:** [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md)

---

## 0. Objetivo

Probar **un solo camino feliz + un rechazo** con datos reales de Appwrite:

```text
Tienda (web o Android)
  → crea UNVERIFIED + soft-hold (reserved += qty)
Dash (este repo)
  → lista el pedido
  → confirma O rechaza con la misma semántica que el operador
Appwrite / tienda
  → stock y buy_state coherentes
```

Si esto falla, **no** se cierra alineación Core 1 del panel.

---

## 1. Precondiciones

| # | Check |
|---|--------|
| 1 | Staging o proyecto Appwrite de prueba (no producción a ciegas) |
| 2 | Producto con `existence` y `reserved` conocidos (anotar IDs) |
| 3 | `available = existence − reserved ≥ 1` antes del pedido |
| 4 | Usuario cliente en tienda capaz de crear UNVERIFIED |
| 5 | Usuario staff (`admin`/`owner`/`sales`) en dash |
| 6 | Consola Appwrite abierta en colecciones `product` y `sale` |

### Valores a anotar (antes)

```text
productId: _______________
existence_antes: _________
reserved_antes: __________
available_antes: _________
qty_pedido: ______________   (1 ≤ qty ≤ available)
saleId (después de crear): _______________
currency_esperada: _______
```

---

## 2. Camino A — Confirm (VERIFIED)

### A1. Tienda

1. Abrir catálogo; verificar badge/available del producto.
2. Montar carrito con `qty_pedido` (clamp debe impedir > available).
3. Completar flujo hasta **UNVERIFIED** (no auto-confirm).
4. Anotar `saleId`.

### A2. Appwrite (tras el pedido)

| Campo | Esperado |
|-------|----------|
| `sale.buy_state` | `UNVERIFIED` |
| `product.reserved` | `reserved_antes + qty_pedido` |
| `product.existence` | **igual** a `existence_antes` |

### A3. Dash

1. Login staff → **Ventas** o **Reservas**.
2. Filtro pendientes: aparece el `saleId`.
3. Abrir detalle: líneas, qty, **currency del documento**, amount.
4. **Confirmar** → diálogo con semántica stock → aceptar.
5. Toast de éxito; pill pasa a confirmada.

### A4. Appwrite (tras confirm)

| Campo | Esperado |
|-------|----------|
| `sale.buy_state` | `VERIFIED` |
| `product.existence` | `existence_antes − qty_pedido` |
| `product.reserved` | `reserved_antes` (volvió al nivel pre-pedido, o `reserved_antes + qty − qty`) |

Fórmula: tras confirm, el hold del pedido se consume junto con el físico:

- `existence_despues = existence_antes − qty`
- `reserved_despues = reserved_despues_de_UNVERIFIED − qty`

### A5. Idempotencia

1. Si el detalle aún permite “Confirmar” no debería (ya VERIFIED).
2. No debe bajar otra vez existence/reserved.

### A6. Tienda

1. Refresh / realtime / reentrada al catálogo.
2. `available` refleja el consume (más bajo en `qty`).

**Camino A:** ☐ PASS · ☐ FAIL — notas: ________________

---

## 3. Camino B — Reject (DELETED)

Usar **otro** pedido UNVERIFIED (no el ya VERIFIED).

### B1. Tienda

Crear segundo UNVERIFIED con `qty2` sobre el mismo u otro producto. Anotar reserved intermedio.

### B2. Dash

1. Abrir detalle → **Rechazar**.
2. Diálogo: solo `reserved -= qty`; existence intacto.

### B3. Appwrite

| Campo | Esperado |
|-------|----------|
| `sale.buy_state` | `DELETED` |
| `product.existence` | sin cambio respecto al momento pre-reject |
| `product.reserved` | baja `qty2` |

### B4. Tienda

`available` sube de nuevo la qty liberada; se puede volver a pedir esa cantidad.

**Camino B:** ☐ PASS · ☐ FAIL — notas: ________________

---

## 4. Negativos rápidos (alineación)

| # | Caso | Esperado |
|---|------|----------|
| N1 | Dash no tiene UI “crear venta B2C” | Confirmado |
| N2 | Rechazar venta ya VERIFIED | Error / bloqueado |
| N3 | Confirmar venta ya DELETED | Error / bloqueado |
| N4 | Catálogo: intentar existence &lt; reserved | Guard de dominio |

**Negativos:** ☐ PASS · ☐ FAIL

---

## 5. Criterio de aceptación 6.2

| Requisito | Obligatorio |
|-----------|-------------|
| Camino A PASS | Sí |
| Camino B PASS | Sí |
| N1–N3 sin regresión grave | Sí |
| Logs dash `[ConfirmSale]` / `[RejectSale]` / `[stock]` coherentes | Recomendado |

Si A o B fallan por stock → revisar `ConfirmSaleFromPanelCaseUse` / `RejectSaleFromPanelCaseUse` y `applyStockDeltas` antes de QA formal.

---

## 6. Registro de ejecución

```text
Fecha: _______________
Entorno Appwrite: _______________
Ejecutor: _______________
Camino A: PASS / FAIL
Camino B: PASS / FAIL
Negativos: PASS / FAIL
Incidencias:
  -
```

Al completar en verde, marcar en [`MVP_CORE1_STATUS.md`](./MVP_CORE1_STATUS.md) la **ejecución** 6.2 y pasar a QA checklist cuando se decida.
