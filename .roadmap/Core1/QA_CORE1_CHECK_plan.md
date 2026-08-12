# QA Core 1 — Checklist (~15 min)

**Última actualización:** 2026-08-12  
**Objetivo:** marcar Core 1 como cerrado con un circuito real tienda → panel → stock.  
**Contrato:** [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md)  
**DoD formal:** [`PHASE_7_3_CORE1_DOD.md`](./PHASE_7_3_CORE1_DOD.md)  
**Pre-gate:** [`PHASE_7_2_PRE_QA_GATE.md`](./PHASE_7_2_PRE_QA_GATE.md) · Smoke: [`SMOKE_6_2.md`](./SMOKE_6_2.md)

Marca cada ítem. Si falla uno **crítico** de stock/ventas, **no** cierres Core 1.

**Fórmula canónica:** `available = max(0, existence − reserved)`

| Evento | existence | reserved |
|--------|-----------|----------|
| Cliente UNVERIFIED | sin cambio | `+= qty` |
| Confirmar (VERIFIED) | `-= qty` | `-= qty` |
| Rechazar (DELETED) | sin cambio | `-= qty` |
| Dar entrada (panel) | `+= qty` | sin cambio |

---

## Registro de sesión

```text
Ejecutor: ____________________
Fecha: _______________________
Env / project: _______________
Dash URL: ____________________
Tienda (web/Android): ________
Rol staff: ___________________
productId: ___________________
existence / reserved / available (base): ____ / ____ / ____
Resultado final: PASS / FAIL
```

---

## 0. Preparación (1 min)

- [X] Backoffice abierto como **owner** o **admin**
- [X] Tienda web (o Android) lista para comprar
- [X] Anota un producto de prueba: **existencia**, **reserved**, **disponible** (`existence − reserved`)

---

## 1. Stock de entrada — backoffice (2 min)

1. **Productos** → elige el producto de prueba  
2. **Dar entrada** → cantidad **> 0** (ej. 5) → **Añadir**  
3. Comprueba:

- [ ] Toast de éxito  
- [X] `existence` sube exactamente esa cantidad  
- [X] `reserved` **no** cambia  
- [X] Disponible = existence − reserved  

**Fallo crítico:** setear `existence` en el formulario de editar como forma principal (debe ser delta vía **Dar entrada**).

---

## 2. Pedido desde la tienda (3 min)

1. En la tienda, compra ese producto (qty conocida, ej. **2**)  
2. Completa el pedido hasta que quede **pendiente / reservado**  
3. En **Productos** (backoffice o cliente tras RT):

- [ ] `reserved` **+= qty**  
- [ ] `existence` **igual**  
- [ ] Disponible baja en **qty**  

**Fallo crítico:** se descuenta `existence` al pedir (eso es confirmación, no reserva).

---

## 3. Ventas pendientes — panel (2 min)

1. **Ventas** → pestaña **Pendientes**  
2. Comprueba:

- [ ] El pedido aparece  
- [ ] Tarjeta con acento **ámbar** / estado pendiente  
- [ ] Nombre, monto, líneas razonables  

3. Abre el detalle:

- [ ] Resumen compacto + **Ver detalles** colapsable  
- [ ] Botones **Confirmar** y **Rechazar**  

**Nota:** el menú **Reservas** es agenda de taller (core futuro); **no** debe listar pedidos de tienda.

---

## 4A. Confirmar venta (2 min)

1. **Confirmar** → acepta el diálogo  
2. Comprueba:

- [ ] Pasa a **confirmada**  
- [ ] `existence −= qty`  
- [ ] `reserved −= qty`  
- [ ] Disponible coherente post-confirmación  
- [ ] Toast de éxito  

---

## 4B. Rechazar venta (alternativa o segundo pedido) (2 min)

Repite §2 con otra qty (ej. **1**), luego **Rechazar**:

- [ ] Estado **rechazada**  
- [ ] `existence` **sin cambio**  
- [ ] `reserved −= qty`  
- [ ] Disponible recupera esa qty  

---

## 5. Realtime / refresco (1–2 min)

Sin recargar a mano (o con poco delay):

- [ ] Tras dar entrada, el listado de productos refleja el stock  
- [ ] Tras confirm/reject, productos y ventas se actualizan  
- [ ] Si hay otra pestaña del panel o la tienda abierta, el stock se alinea (Appwrite RT y, si aplica, Pulse)

---

## 6. Roles rápidos (1–2 min)

| Acción | Owner/Admin | Viewer |
|--------|-------------|--------|
| Dar entrada | Sí | No |
| Confirmar / rechazar | Sí | No |
| Limpiar anónimos | Solo owner/admin | No |
| Ver ventas / productos | Sí | Sí (solo lectura) |

- [ ] Viewer no puede mutar stock ni decisiones de venta  

---

## 7. Usuarios anónimos (opcional, 1 min)

- [ ] Listado **no** muestra emails vacíos  
- [ ] **Limpiar anónimos** → toast + banner de resultado  

---

## Criterio de cierre Core 1

**Cerrado (PASS)** si pasan **§1, §2, §3 y (§4A o §4B)** sin fallo crítico de stock.

**No cerrado (FAIL)** si:

- se setea `existence` en lugar de delta, o  
- al pedir se baja `existence`, o  
- confirm/reject no aplica las reglas de `existence` / `reserved`, o  
- el pedido no aparece en **Ventas → Pendientes**.

Anota al cerrar: **PASS / FAIL** + producto y qty usadas.
