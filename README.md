# dash_alejo_taller

**Dashboard de administración y gobierno de negocio** para [Alejo Taller](https://github.com/danielitoCode/AlejoTaller) — panel staff (owner / admin / sales / viewer) sobre el mismo backend Appwrite que la tienda.

**Estado del núcleo:**

| Núcleo | Estado |
|--------|--------|
| **Core 1** | **Cerrado** (2026-08-12) — soft-hold, ventas UNVERIFIED→VERIFIED/DELETED, catálogo |
| **Core 2** | **Cerrado** (2026-08-24) — factura de entrada, `stock_movements`, finance/COGS, cola, reservas taller; merge PR [#12](https://github.com/danielitoCode/dash_alejo_taller/pull/12) → `master` |

---

## Producción

| Superficie | URL |
|------------|-----|
| **Dashboard (este repo)** | [https://alejotaller.onrender.com/](https://alejotaller.onrender.com/) |
| **Tienda web (cliente)** | Ver monorepo / deploy en [AlejoTaller](https://github.com/danielitoCode/AlejoTaller) |

> Si el dominio de producción del panel cambia, actualiza esta tabla y `DEPLOYMENT.md`.

---

## Ecosistema de repositorios

| Repo | Rol |
|------|-----|
| **[dash_alejo_taller](https://github.com/danielitoCode/dash_alejo_taller)** (este) | Back-office web (Svelte + Vite + Appwrite) |
| **[AlejoTaller](https://github.com/danielitoCode/AlejoTaller)** | Monorepo: tienda Android, operador de escaneo, web cliente, políticas |
| Operador / scan | Confirmación en mostrador (primario); dash = supervisión con la misma semántica de stock |

Contrato de stock compartido:

```text
available = max(0, existence − reserved)

Cliente UNVERIFIED  → reserved += qty
Confirmar VERIFIED  → existence -= qty, reserved -= qty  (+ salida_venta + sale_finance_event)
Rechazar DELETED    → reserved -= qty
Factura de entrada  → existence += qty (+ stock_movements entrada + last_unit_cost)
```

- Soft-hold Core 1: [`.roadmap/Core1/CANONICAL_RULES_FREEZE.md`](.roadmap/Core1/CANONICAL_RULES_FREEZE.md)  
- Deltas Core 2: [`.roadmap/Core2/POLICY_DELTAS_CORE2.md`](.roadmap/Core2/POLICY_DELTAS_CORE2.md)

---

## Qué incluye Core 1 (cerrado)

- **Auth y roles** staff con rutas protegidas
- **Productos:** catálogo, imágenes, stock visible
- **Ventas:** listado, pendientes, detalle, confirmar y rechazar
- **Realtime** productos/ventas; usuarios, categorías, promos, support, ajustes

Estado: [`.roadmap/Core1/MVP_CORE1_STATUS.md`](.roadmap/Core1/MVP_CORE1_STATUS.md)

---

## Qué incluye Core 2 (cerrado · 2026-08-24)

- **Factura de entrada** multi-línea: única vía de alta de stock en UI; producto nuevo en factura; catálogo existence 0
- **`stock_movements`:** `entrada`, `salida_venta` (paridad panel/operador), `ajuste`
- **Finanzas:** `last_unit_cost`, `sale_finance_event`, KPIs solo VERIFIED
- **Cola UNVERIFIED** + badges nav (ventas / reservas / mensajes)
- **Inventario** movements + facturas; **reservas taller** (`workshop_reservation`)
- Permisos Appwrite: staff write / cliente sin write en movements, purchase, finance, reservation

Checklist: [`.roadmap/Core2/CORE2_UNIFIED_CHECKLIST.md`](.roadmap/Core2/CORE2_UNIFIED_CHECKLIST.md)  
Estado: [`.roadmap/Core2/MVP_CORE2_STATUS.md`](.roadmap/Core2/MVP_CORE2_STATUS.md)

---

## Stack

- **Svelte 5** + **Vite** + TypeScript · **Appwrite** · Pulse/Pusher opcional · Deploy **Render** (`DEPLOYMENT.md`)

---

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
npm run check && npm run test:unit && npm run build
```

No commitear `.env`.

---

## Roadmap

| Núcleo | Índice |
|--------|--------|
| Core 1 | [`.roadmap/Core1/README.md`](.roadmap/Core1/README.md) |
| Core 2 | [`.roadmap/Core2/README.md`](.roadmap/Core2/README.md) |
| Índice | [`.roadmap/README.md`](.roadmap/README.md) |

---

## Pendiente no bloqueante (post–Core 2)

1. Smoke opcional ajuste / confirm operador dispositivo  
2. Reserva taller desde cliente web  
3. E2E tienda ↔ dash / deuda UI

---

## Licencia / uso

Proyecto privado de operación de **Alejo Taller**.
