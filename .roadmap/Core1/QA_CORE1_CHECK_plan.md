# QA Core 1 — Checklist detallado Back-office (`dash_alejo_taller`)

**Última actualización:** 2026-08-10  
**Objetivo:** validar que el panel respeta el Core 1 del ecosistema AlejoTaller (soft-hold, confirm/reject, roles, currency) y es usable como gobierno de negocio.  
**Contrato:** [`CANONICAL_RULES_FREEZE.md`](./CANONICAL_RULES_FREEZE.md)  
**DoD formal:** [`PHASE_7_3_CORE1_DOD.md`](./PHASE_7_3_CORE1_DOD.md)  
**Pre-gate:** [`PHASE_7_2_PRE_QA_GATE.md`](./PHASE_7_2_PRE_QA_GATE.md) · Smoke: [`SMOKE_6_2.md`](./SMOKE_6_2.md)

Marca `[x]` al verificar. Usa **staging**. Anota `FAIL` + causa si aplica.

**Fórmula canónica:** `available = max(0, existence − reserved)`

| Evento | existence | reserved |
|--------|-----------|----------|
| Cliente UNVERIFIED | sin cambio | `+= qty` |
| Dash/operador VERIFIED | `-= qty` | `-= qty` |
| Dash/operador DELETED | sin cambio | `-= qty` |

---

## Registro de sesión QA

```text
Ejecutor: ____________________
Fecha: _______________________
Appwrite project / env: _______
Dash URL: ____________________
Tienda (web/Android): ________
Staff role usado: ____________
productId principal: _________
existence_base / reserved_base / available_base:
  ____ / ____ / ____
```

---

## 0. Precondiciones (Gate A + datos)

### 0.1 Automático local

```bash
npm run test:unit && npm run check && npm run build
```

- [ ] **P0.1** `test:unit` PASS  
- [ ] **P0.2** `check` PASS (o excepción documentada no-stock)  
- [ ] **P0.3** `build` PASS  

### 0.2 Datos y acceso

- [ ] **P0.4** `.env` local no trackeado; valores desde `.env.example`  
- [ ] **P0.5** Sesión staff de prueba (`admin` o `owner` ideal; también preparar `sales` y `viewer` si se prueba A completo)  
- [ ] **P0.6** Producto en Appwrite con `existence` y `reserved` **conocidos y anotados**  
- [ ] **P0.7** `available ≥ 1` antes de crear pedidos de prueba  
- [ ] **P0.8** Capacidad de crear pedido **desde la tienda** (web o Android), no inventado solo en dash  
- [ ] **P0.9** Consola Appwrite abierta: colecciones `product` y `sale`  

**Bloque 0:** ☐ PASS · ☐ FAIL — notas: _______________

---

## A. Auth y roles staff

**Policy:** roles `owner > admin > sales > viewer`; sin visitante de tienda en el panel.

### A1 Login / sesión

| ID | Caso | Pasos | Esperado | ☐ |
|----|------|-------|----------|---|
| **A1.1** | Login válido | Credenciales staff correctas | Entra a dashboard / shell del panel | |
| **A1.2** | Login inválido | Password o email incorrecto | No entra; mensaje de error; sin sesión usable | |
| **A1.3** | Logout | Cerrar sesión | Vuelve a login; UI no muestra datos de staff anterior | |
| **A1.4** | Refresh con sesión | F5 estando logueado | Sigue autenticado (o rehidrata sin datos ajenos) | |

### A2 Gates por rol

Preparar o rotar usuarios de prueba por rol.

| ID | Rol | Debe poder | No debe poder | ☐ |
|----|-----|------------|---------------|---|
| **A2.1** | `viewer` | Dashboard / support (lectura según config) | Editar productos, users, confirmar ventas si policy lo niega | |
| **A2.2** | `sales` | Ventas / reservas (supervisión) | UserManagement, catálogo product/category (si policy) | |
| **A2.3** | `admin` / `owner` | Users, product, category, sales, promo, settings | — | |
| **A2.4** | URL directa | Navegar a ruta prohibida para el rol (hash/ruta interna) | Unauthorized, redirect o bloqueo claro | |
| **A2.5** | `canManageRole` | Admin intenta asignar rol ≥ al suyo si aplica | UI/API impide escalada indebida | |

**Bloque A:** ☐ PASS · ☐ FAIL — notas: _______________

---

## B. Catálogo y warehouse (panel)

**Policy:** panel puede CRUD catálogo y ajustar `existence`; **no** editar `reserved` a mano; `existence ≥ reserved` al guardar.

### B1 Lectura de stock

| ID | Caso | Cómo verificar | Esperado | ☐ |
|----|------|----------------|----------|---|
| **B1.1** | Available visible | Listado y/o detalle producto | Se muestra stock usable = `existence − reserved` (o equivalente claro) | |
| **B1.2** | Reserved no editable | Formulario edición producto | Campo `reserved` ausente, disabled o solo lectura | |
| **B1.3** | Coherencia con Appwrite | Comparar UI vs documento `product` | Mismos `existence` / `reserved` (tras sync) | |

### B2 Escritura catálogo

| ID | Caso | Pasos | Esperado | ☐ |
|----|------|-------|----------|---|
| **B2.1** | Alta válida | Crear producto `existence ≥ 0`, precio > 0, categoría | Persiste; `reserved` inicia en 0 | |
| **B2.2** | existence &lt; reserved | Producto con reserved &gt; 0; intentar bajar existence por debajo | Error de dominio; no guarda | |
| **B2.3** | Update nombre/precio | Cambiar datos de catálogo | Guarda; **reserved en Appwrite no se resetea a 0** | |
| **B2.4** | Ajuste existence válido | existence nueva ≥ reserved actual | Guarda; tienda al refrescar ve nuevo available | |
| **B2.5** | Categorías | CRUD básico categoría | No borra en silencio productos; o mensaje claro | |

### B3 Impacto tienda

| ID | Caso | Esperado | ☐ |
|----|------|----------|---|
| **B3.1** | Tras B2.4 | Tienda (refresh/RT) refleja existence actualizado | |

**Bloque B:** ☐ PASS · ☐ FAIL — notas: _______________

---

## C. Ventas — supervisión y decisión de stock

**Policy:** solo tienda crea UNVERIFIED; dash confirma/rechaza con semántica de operador; currency del documento; sin UI “nueva venta B2C”.

> Los ítems **C2–C4** se solapan con [`SMOKE_6_2.md`](./SMOKE_6_2.md). Si el smoke ya pasó, revalidar aquí con los mismos números o re-ejecutar.

### C0 Datos previos (anotar)

```text
productId: _______________
existence_antes: _________
reserved_antes: __________
available_antes: _________
qty1 (confirm): __________
qty2 (reject): ___________
saleId_confirm: __________
saleId_reject: ___________
currency_cliente: ________
```

### C1 Listado y detalle (lectura)

| ID | Caso | Pasos | Esperado | ☐ |
|----|------|-------|----------|---|
| **C1.1** | Origen tienda | Crear UNVERIFIED en tienda con qty1 | Aparece en Ventas y/o Reservas del dash | |
| **C1.2** | Filtro pendientes | Tab/filtro UNVERIFIED | Solo pendientes; contadores coherentes | |
| **C1.3** | Filtros VERIFIED / DELETED | Cambiar tabs | Listas separadas correctas | |
| **C1.4** | Detalle líneas | Abrir saleId | productId, nombre si resuelve, qty, precios de línea | |
| **C1.5** | Currency | Ver amount en detalle y listado | Moneda del **documento** Sale; **no** forzar USD si el cliente usó otra | |
| **C1.6** | Metadatos | userId, fechas, delivery si existe | Visibles; no inventados | |
| **C1.7** | Sin “crear venta” | Revisar UI Ventas/Reservas | No hay alta B2C / “nueva venta” de tienda | |

### C2 Tras UNVERIFIED (Appwrite, antes de decidir)

| ID | Campo | Esperado | ☐ |
|----|-------|----------|---|
| **C2.1** | `sale.buy_state` | `UNVERIFIED` | |
| **C2.2** | `product.reserved` | `reserved_antes + qty1` | |
| **C2.3** | `product.existence` | **igual** a `existence_antes` | |

### C3 Confirm (VERIFIED)

| ID | Caso | Pasos | Esperado | ☐ |
|----|------|-------|----------|---|
| **C3.1** | Diálogo | Pulsar Confirmar | Texto menciona existence−= y reserved−= | |
| **C3.2** | UI post | Aceptar | Pill VERIFIED; botones decisión deshabilitados / “Ya confirmada” | |
| **C3.3** | Appwrite buy_state | Consola | `VERIFIED` | |
| **C3.4** | Appwrite existence | Consola | `existence_antes − qty1` | |
| **C3.5** | Appwrite reserved | Consola | `reserved_despues_UNVERIFIED − qty1` (= vuelve hacia `reserved_antes` si no hay otros holds) | |
| **C3.6** | Available en detalle dash | Línea “available ahora” (6.4) | Refleja nuevo available sin recargar app completa | |
| **C3.7** | Idempotencia | Intentar confirmar de nuevo | No segunda resta de stock; sin botón o no-op seguro | |
| **C3.8** | Logs | Consola dev | `[ConfirmSale]` / `[stock]` / opcional `[6.3]` `[6.4]` | |

### C4 Reject (DELETED) — **otro** pedido

| ID | Caso | Pasos | Esperado | ☐ |
|----|------|-------|----------|---|
| **C4.1** | Nuevo UNVERIFIED | Tienda qty2 | saleId_reject; reserved sube qty2 | |
| **C4.2** | Rechazar | Dash → Rechazar + diálogo | reserved−=qty; existence sin cambio | |
| **C4.3** | Appwrite buy_state | Consola | `DELETED` | |
| **C4.4** | Appwrite existence | Consola | Igual que pre-reject | |
| **C4.5** | Appwrite reserved | Consola | Baja qty2 | |
| **C4.6** | Idempotencia DELETED | Re-rechazar | No segunda liberación indebida / UI bloqueada | |
| **C4.7** | Bloqueo cruzado | Rechazar venta ya VERIFIED | Error / no permitido | |
| **C4.8** | Bloqueo cruzado | Confirmar venta ya DELETED | Error / no permitido | |

### C5 Coherencia post-decisión (panel)

| ID | Caso | Esperado | ☐ |
|----|------|----------|---|
| **C5.1** | Catálogo panel | Productos afectados muestran existence/reserved nuevos tras decisión | |
| **C5.2** | Listado ventas | Filtros muestran el pedido en el tab correcto | |

**Bloque C:** ☐ PASS · ☐ FAIL — notas: _______________

---

## D. Seguridad y secretos

| ID | Caso | Cómo | Esperado | ☐ |
|----|------|------|----------|---|
| **D1.1** | `.env` | `git status` / tree | No trackear secretos; solo `.env.example` | |
| **D1.2** | Bundle browser | Build + búsqueda de API keys server | No hay API key de servidor Appwrite en assets públicos | |
| **D1.3** | Roles mutación | Intento cambiar roles sin admin | Fallo controlado | |
| **D1.4** | create venta API | Si se invoca create desde consola/dev | `BackofficeCannotCreateB2cSale` / 4.4–6.1 | |

**Bloque D:** ☐ PASS · ☐ FAIL — notas: _______________

---

## E. E2E cruzado ecosistema (tienda ↔ dash ↔ Appwrite)

| ID | Flujo | Esperado | ☐ |
|----|-------|----------|---|
| **E1** | Tienda UNVERIFIED qty ≤ available → dash lista | Mismo saleId; C2.x cumple | |
| **E2** | Dash confirm → Appwrite stock → tienda refresh/RT | available tienda baja qty; buy_state VERIFIED | |
| **E3** | Tienda otro UNVERIFIED → dash reject → tienda | available recupera qty2; se puede volver a comprar | |
| **E4** | (Opcional) Operador ve mismo buy_state | Coherente con dash | |

**Bloque E:** ☐ PASS · ☐ FAIL — notas: _______________

---

## R. Regresión rápida (no bloquea stock si C/E verdes)

| ID | Caso | Esperado | ☐ |
|----|------|----------|---|
| **R1** | Support inbox | Abre sin tumbar shell | |
| **R2** | Promos listado | Carga o empty state claro | |
| **R3** | Dashboard home | Sin error fatal sin datos | |
| **R4** | Navegación ventas ↔ productos | Sin estado fantasma de loading eterno | |

**Bloque R:** ☐ PASS · ☐ FAIL — notas: _______________

---

## Criterio de cierre Core 1 dash

| Bloque | Requerido para cerrar |
|--------|----------------------|
| **0** Precondiciones | P0.1–P0.3 y datos P0.6–P0.8 |
| **A** Auth | A1.1–A1.3 y al menos A2.3; ideal todo A2 |
| **B** Catálogo | B1.1–B1.2, B2.1–B2.4, B3.1 |
| **C** Ventas | **Todo C1–C5** (semántica stock) |
| **D** Seguridad | **D1.1** mínimo absoluto; D1.2 recomendado |
| **E** Cruzado | **E1–E3** |
| **R** Regresión | Deseable; no bloquea si C/E OK |

### Matriz de decisión

| Resultado | Acción |
|-----------|--------|
| C o E FAIL por stock | **No cerrar** Core 1; fix 5.x/6.x + re-smoke |
| Solo R FAIL | Documentar deuda; se puede cerrar semántica |
| Todo requerido PASS | DoD 7.3 = SÍ → actualizar `MVP_CORE1_STATUS.md` |

---

## Resumen ejecutivo (rellenar al final)

```text
Bloque 0: PASS / FAIL
Bloque A: PASS / FAIL
Bloque B: PASS / FAIL
Bloque C: PASS / FAIL
Bloque D: PASS / FAIL
Bloque E: PASS / FAIL
Bloque R: PASS / FAIL / N/A

DoD Core 1 dash (PHASE_7_3):  SÍ / NO
Fecha cierre: ________________
Firma: _______________________

Incidencias bloqueantes:
  -
Deuda no bloqueante:
  -
```
