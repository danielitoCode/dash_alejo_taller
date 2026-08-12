# Core 2 — Plan de implementación por fases (checklist)

**Última actualización:** 2026-08-12  
**Estado del plan:** publicado · ejecución **0%**  
**Repos:** dash_alejo_taller + AlejoTaller (schema / operador)

Marca `[x]` al completar. No avanzar de fase crítica de stock sin regresión verde del QA Core 1 (15 min).

**Fórmula canónica (congelada):** `available = max(0, existence − reserved)`

---

## Registro de avance

```text
Inicio plan: 2026-08-12
Ejecutor: ____________________
Fase actual: 2.0
Core 2 cerrado: NO
```

---

## Fase 2.0 — Alcance y políticas delta

**Objetivo:** congelar alcance MVP y documentar deltas de política antes de schema.

- [x] Documentar plan por fases (este archivo)
- [x] README + STATUS + POLICY_DELTAS en `.roadmap/Core2/`
- [ ] Decisión producto: **Reservas de taller** ¿dentro del MVP Core 2? (SÍ / NO / 2.5)
- [ ] Revisar y aceptar [`POLICY_DELTAS_CORE2.md`](./POLICY_DELTAS_CORE2.md) en ambos repos
- [ ] Espejo mínimo de alcance en `AlejoTaller/.roadmap/Core2/` (enlace o copia de fases)

**Criterio de salida 2.0:** alcance firmado + políticas delta aceptadas.

---

## Fase 2.1 — Schema `stock_movements` (AlejoTaller / Appwrite)

**Objetivo:** collection y contrato de datos listos para operador y dash.

- [ ] Collection `stock_movements` creada en Appwrite (staging)
- [ ] Campos: `product_id`, `type`, `quantity`, `balance_after`, `reason`, `user_id`, `sale_id?`, `created_at`
- [ ] Enum `type`: `entrada` | `salida_venta` | `ajuste` | `devolucion`
- [ ] Permisos: lectura staff/operador; escritura staff/operador (no cliente)
- [ ] DTO + repo shared (o contrato documentado si dash no comparte código aún)
- [ ] Documento de schema enlazado desde este plan

**Criterio de salida 2.1:** se puede crear un movimiento de prueba desde consola/API con `balance_after` coherente.

---

## Fase 2.2 — Operador: traza al VERIFIED (AlejoTaller)

**Objetivo:** al confirmar venta, además del soft-hold Core 1, registrar `salida_venta`.

- [ ] En flujo VERIFIED: escribir `stock_movements` tipo `salida_venta` por línea (o agregado documentado)
- [ ] `balance_after` = `existence` tras el consume
- [ ] `sale_id` + `user_id` (operador) rellenados
- [ ] Idempotencia: segundo confirm no duplica movimiento ni stock
- [ ] Reject/DELETED: sin `salida_venta` (solo release `reserved`, como Core 1)
- [ ] Tests o smoke operador: confirm → movement visible

**Criterio de salida 2.2:** confirm en operador deja traza; soft-hold sigue correcto.

---

## Fase 2.3 — Panel: movimientos, entrada y ajuste (dash)

**Objetivo:** el back-office opera inventario formal sin romper Core 1.

### 2.3.1 Lectura

- [ ] Vista listado `stock_movements` (filtros: producto, tipo, rango fechas)
- [ ] Detalle o chip de últimos movimientos en ficha de producto

### 2.3.2 Entrada de mercancía

- [ ] Flujo «Dar entrada» escribe `existence += qty` **y** movimiento `entrada`
- [ ] Motivo + usuario staff obligatorios
- [ ] Toast + listado actualizado (RT o refresh)
- [ ] `reserved` no cambia

### 2.3.3 Ajuste auditado

- [ ] UI ajuste (alta/baja) con motivo
- [ ] Validación: post-ajuste `existence >= reserved`
- [ ] Movimiento tipo `ajuste` + `balance_after`
- [ ] Roles: solo owner/admin (viewer no muta)

### 2.3.4 Devolución (si política aceptada en 2.0)

- [ ] Desde venta VERIFIED o inventario: `existence += qty` + `devolucion`
- [ ] Motivo obligatorio; no reabre soft-hold de la venta

**Criterio de salida 2.3:** entrada y ajuste usables en panel; QA Core 1 stock sigue PASS.

---

## Fase 2.4 — Reportes y cola UNVERIFIED (dash)

**Objetivo:** supervisión operativa diaria.

- [ ] Cola de ventas UNVERIFIED con **antigüedad** (ordenado por más viejo)
- [ ] Alerta o badge de stock bajo (umbral configurable o fijo documentado)
- [ ] Indicador de `reserved` alto / hold prolongado (regla documentada)
- [ ] Export CSV mínimo de ventas por rango de fechas
- [ ] RT / refresco de cola (reutilizar suscripción `sale` de Core 1)

**Criterio de salida 2.4:** staff puede priorizar pedidos viejos y exportar un rango de ventas.

---

## Fase 2.5 — Reservas de taller (opcional en MVP)

> Marcar esta fase como **N/A** si en 2.0 se decide diferir.

- [ ] Collection `appointment` / `booking` (o nombre acordado) en Appwrite
- [ ] Estados: al menos solicitada → confirmada → realizada | cancelada
- [ ] Panel: sustituir placeholder del menú **Reservas** por listado + crear/editar estado
- [ ] **No** mostrar pedidos `Sale` de tienda en Reservas
- [ ] (Fuera de MVP) descuento de piezas por cita

**Criterio de salida 2.5:** agenda usable en panel sin contaminar Ventas.

---

## Fase 2.6 — Seguridad, CI y cierre DoD

**Objetivo:** endurecer y declarar Core 2 cerrado.

### Seguridad

- [ ] Auditoría de permisos Appwrite por rol (owner/admin/sales/viewer)
- [ ] Secrets solo en Cloudflare/Render (no en git)
- [ ] Viewer no muta stock, movimientos ni decisiones de venta (§6 Core 1)

### CI / plataforma

- [ ] `check` + `test:unit` + `build` en PR en verde
- [ ] (Opcional) decisión documentada go/no-go monorepo `AlejoTaller/admin`

### Documentación de cierre

- [ ] `MVP_CORE2_STATUS.md` → Core 2 cerrado + fecha
- [ ] Checklist de este plan en verde (fases obligatorias)
- [ ] Smoke: entrada → pedido → confirm (operador o dash) → movement `salida_venta`
- [ ] Regresión QA Core 1 (15 min) PASS

**Criterio de salida 2.6 = DoD Core 2 (borrador):**

1. `stock_movements` existe y registra al menos `entrada` y `salida_venta`.  
2. Panel puede entrada + ajuste sin `existence < reserved`.  
3. Soft-hold Core 1 sin regresión.  
4. Si 2.5 activa: reservas separadas de ventas.  
5. STATUS del repo marca **Core 2 cerrado**.

---

## Fuera de este núcleo (Core 3+)

- Contabilidad / multi-almacén  
- Piezas de reparación descontando stock por cita  
- Function Appwrite atómica confirm+stock+movement (puede adelantarse si hace falta)  
- E2E automatizado completo tienda ↔ dash ↔ operador  

---

## Orden recomendado de trabajo

```text
2.0  alcance + políticas
2.1  schema Appwrite
2.2  operador salida_venta     ⎫ pueden solaparse en parte
2.3  dash movimientos/entrada ⎭
2.4  reportes / cola
2.5  reservas (si aplica)
2.6  seguridad + DoD
```
