# QA Core 1 — Checklist Back-office (`dash_alejo_taller`)

**Última actualización:** 2026-08-09  
**Objetivo:** validar que el panel no rompe el Core 1 del ecosistema AlejoTaller y que el gobierno de negocio es usable.

Marca con `[x]` al verificar. Usa datos de staging o producción controlada.

---

## 0. Precondiciones

- [ ] Build `npm run build` / `npm run check` sin errores bloqueantes
- [ ] Sesión staff (ideal: un usuario `admin` o `owner` de prueba)
- [ ] Al menos un producto con `existence` y `reserved` conocidos en Appwrite
- [ ] Referencia: pedido de prueba creado desde la **tienda** (web o Android), no inventado solo en dash

---

## A. Auth y roles

- [ ] **A1.1** Login staff válido entra al dashboard
- [ ] **A1.2** Credenciales inválidas no entran
- [ ] **A1.3** Rol `viewer`: ve dashboard/support; **no** edita productos ni usuarios
- [ ] **A1.4** Rol `sales`: ventas/reservas; **no** UserManagement ni catálogo (si policy lo prohíbe)
- [ ] **A1.5** Rol `admin`/`owner`: acceso a users, product, category, sales, promo, settings
- [ ] **A1.6** Ruta directa por URL a zona prohibida → Unauthorized o redirect
- [ ] **A1.7** Logout cierra sesión y no deja datos sensibles en UI

---

## B. Catálogo y warehouse (UI)

- [ ] **B1.1** Listado de productos muestra stock usable (`available` o existence−reserved)
- [ ] **B1.2** Detalle/edición no trata `reserved` como stock libre editable
- [ ] **B1.3** No se puede dejar `existence < reserved` al guardar
- [ ] **B1.4** Alta producto con `existence >= 0`; precio >= 0
- [ ] **B1.5** Categorías CRUD básico sin romper productos asociados (o mensaje claro)
- [ ] **B1.6** Tras guardar, la **tienda** refleja existence actualizado (sync/RT o refresh)

---

## C. Ventas (supervisión)

- [ ] **C1.1** Aparece el pedido UNVERIFIED creado desde la tienda
- [ ] **C1.2** Detalle muestra líneas, cantidades, **currency** e importe del cliente
- [ ] **C1.3** Confirmar (VERIFIED): `reserved` baja y `existence` baja en la cantidad del pedido
- [ ] **C1.4** Rechazar (DELETED): solo baja `reserved`; `existence` igual
- [ ] **C1.5** Segunda confirmación del mismo pedido no vuelve a descontar (idempotencia)
- [ ] **C1.6** Tienda/operador ven el `buy_state` coherente tras la acción del dash

---

## D. Seguridad y repo (humo)

- [ ] **D1.1** No hay `.env` con secretos en el working tree trackeado (solo example)
- [ ] **D1.2** Mutaciones de usuarios/roles requieren sesión admin y function/API adecuada
- [ ] **D1.3** Panel no expone API key de Appwrite server en el bundle del browser

---

## E. E2E cruzado mínimo (ecosistema)

- [ ] **E1** Tienda: crear UNVERIFIED con qty ≤ available → dash lo lista
- [ ] **E2** Dash: confirmar → stock coherente en Appwrite y en tienda tras refresh/RT
- [ ] **E3** Tienda: otro UNVERIFIED → dash rechaza → reserved liberado; tienda puede volver a comprar esa qty

---

## R. Regresión rápida

- [ ] **R1** Support inbox abre sin tumbar el shell
- [ ] **R2** Promos listado carga
- [ ] **R3** Dashboard home no error fatal sin datos

---

## Criterio de cierre Core 1 dash

| Bloque | Requerido |
|--------|-----------|
| A Auth/roles | Todo A en verde |
| B Catálogo | B1.1–B1.4 y B1.6 |
| C Ventas | C1.1–C1.6 |
| E Cruzado | E1–E3 |
| D Seguridad | D1.1 como mínimo absoluto |

Si C o E fallan por semántica de stock → **no cerrar** Core 1; alinear con `WAREHOUSE_POLICY` / `SALE_POLICY` antes.
