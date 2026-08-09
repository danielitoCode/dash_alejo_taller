# Tarea 0.1 — Congelación de reglas canónicas (Core 1 Back-office)

**Estado:** HECHO  
**Fecha de congelación:** 2026-08-09  
**Uso:** única hoja de verdad durante la alineación del dash con clientes/operador.  
**No negociable** hasta cierre formal de Core 1 del dash (salvo bug que contradiga Appwrite real).

Si hay conflicto entre código del dash y este documento, **gana este documento** (y el canónico de AlejoTaller). Se corrige el código, no la regla.

---

## 0. Fuentes

| Prioridad | Documento |
|-----------|-----------|
| 1 (ecosistema stock/venta) | `AlejoTaller/.policies/warehouse/WAREHOUSE_POLICY.md` |
| 1 (ecosistema venta) | `AlejoTaller/.policies/sale/SALE_POLICY.md` |
| 2 (panel) | `dash_alejo_taller/.policies/*` |
| 3 (este freeze) | Resumen operativo para implementar |

Auth de **tienda** (visitante) no aplica al panel. Auth del panel = roles staff.

---

## 1. Stock — fórmulas y campos

| Símbolo | Significado | Regla |
|---------|-------------|--------|
| `existence` | Unidades físicas en almacén | Entero ≥ 0. Solo baja en **VERIFIED** (consume) o ajuste admin controlado |
| `reserved` | Unidades en soft-hold (pedidos UNVERIFIED) | Entero ≥ 0. Sube solo al crear pedido **cliente**. Baja en release/consume |
| `available` | Vendible ahora | **`available = max(0, existence − reserved)`** |

### Invariantes

1. Siempre `existence >= 0` y `reserved >= 0`.
2. Tras cualquier guardado del **panel** sobre producto: **`existence >= reserved`**.
3. **Autoridad:** Appwrite. Dexie/cache solo UI; no autoriza hold ni verify.
4. El panel **no** ejecuta soft-hold B2C (`reserved +=` por “venta admin”).
5. El panel **no** edita `reserved` a mano en Core 1.

### Tabla de efectos (obligatoria)

| Evento | `existence` | `reserved` |
|--------|-------------|------------|
| Cliente crea pedido (`UNVERIFIED`) | sin cambio | `+= qty` |
| Cliente cancela UNVERIFIED | sin cambio | `-= qty` |
| Operador o **dash** confirma (`VERIFIED`) | `-= qty` | `-= qty` |
| Operador o **dash** rechaza (`DELETED`) | sin cambio | `-= qty` |
| Panel ajusta entrada de mercancía | `+=` (o set ≥ reserved) | sin cambio |

---

## 2. Venta — estados y actores

| Estado | Quién lo crea / pone | Stock |
|--------|----------------------|--------|
| `UNVERIFIED` | **Solo cliente** (web / Android tienda) | soft-hold |
| `VERIFIED` | Operador (primario) o staff dash (supervisión) | consume |
| `DELETED` | Operador o staff dash | release reserved |

### Congelado para el dash

1. **No crear** pedidos B2C desde el panel en Core 1.
2. Confirmar / rechazar, si se expone, debe producir el **mismo resultado en Appwrite** que el operador.
3. Idempotencia: segundo confirm/reject sobre el mismo estado final **no** vuelve a restar stock.
4. UI de detalle: mostrar **`currency`** y **`amount`** del documento Sale (los eligió el cliente). No forzar USD ni reconvertir tasa en el panel.
5. `SaleType` (NORMAL / DISCOUNT / GIFT) es del flujo operador; el dash en Core 1 prioriza no romper stock. Si el dash confirma sin chips de tipo, no inventar descuentos; no pisar amount del cliente salvo flujo explícito documentado después.

---

## 3. Competencias por superficie (quién hace qué)

| Acción | Tienda cliente | Operador | Dash |
|--------|----------------|----------|------|
| Soft-hold al pedir | Sí | No | **No** |
| Confirmar / rechazar en piso | No | **Primario** | Secundario (misma semántica) |
| CRUD catálogo / existence inicial | No | No | **Sí** |
| Roles staff | No | No | **Sí** |
| Promos / support gobierno | No | Limitado | **Sí** |

---

## 4. Auth panel (staff) — congelado

Roles: `owner` > `admin` > `sales` > `viewer`.

| Capacidad | owner | admin | sales | viewer |
|-----------|:-----:|:-----:|:-----:|:------:|
| Dashboard / support (lectura) | sí | sí | sí | sí |
| Ventas / reservas (supervisión) | sí | sí | sí | no |
| Catálogo product/category | sí | sí | no | no |
| Users / roles | sí | sí | no | no |
| Promo / settings | sí | sí | no | no |

- Sin modo visitante de tienda en el panel.
- `canManageRole`: no escalar roles por encima del manager.

Detalle: `.policies/auth/AUTH_POLICY.md` (este repo).

---

## 5. Decisiones explícitas Core 1 (para no reabrir debate)

| Tema | Decisión congelada |
|------|-------------------|
| Fórmula available | Solo `existence - reserved` |
| Reserved editable en form producto | **No** |
| Verify desde dash | Permitido si semántica = operador |
| Realtime obligatorio en dash | **No** en Core 1 (sí coherencia al refrescar) |
| stock_movements | **Core 2** |
| Function Appwrite transaccional total | **Core 2** (o cuando exista compartida con operador) |
| Monorepo merge | **Después** de Core 1 |

---

## 6. Checklist de aceptación de la tarea 0.1

- [x] Documento de freeze publicado en el repo
- [x] Fórmula `available` escrita una sola vez sin ambigüedad
- [x] Tabla de efectos stock UNVERIFIED / VERIFIED / DELETED
- [x] Quién crea pedidos vs quién confirma
- [x] Roles staff resumidos
- [x] Referencias a políticas canónicas AlejoTaller + dash

**Siguiente tarea:** **0.2** Higiene de secretos (`.env` fuera de git, `.gitignore`).
