# dash_alejo_taller

**Dashboard de administración y gobierno de negocio** para [Alejo Taller](https://github.com/danielitoCode/AlejoTaller) — panel staff (owner / admin / sales / viewer) sobre el mismo backend Appwrite que la tienda.

**Estado del núcleo:** **Core 1 cerrado** (2026-08-12) — stock soft-hold, ventas pendientes, confirm/reject y catálogo alineados con el contrato canónico.

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
| **[AlejoTaller](https://github.com/danielitoCode/AlejoTaller)** | Monorepo: tienda Android, operador de escaneo, web cliente, políticas y contratos de stock/venta |
| Operador / scan | Confirmación en mostrador (primario en tienda física); el dash es supervisión / respaldo con **la misma semántica de stock** |

Contrato de stock compartido (no negociable en Core 1):

```text
available = max(0, existence − reserved)

Cliente UNVERIFIED  → reserved += qty
Confirmar VERIFIED  → existence -= qty, reserved -= qty
Rechazar DELETED    → reserved -= qty
Dar entrada (panel) → existence += qty
```

Detalle: [`.roadmap/Core1/CANONICAL_RULES_FREEZE.md`](.roadmap/Core1/CANONICAL_RULES_FREEZE.md)

---

## Qué incluye Core 1 (cerrado)

- **Auth y roles** staff (owner / admin / sales / viewer) con rutas protegidas
- **Productos:** catálogo, imágenes, «Dar entrada» (delta), stock visible (`existence` / `reserved` / disponible)
- **Ventas:** listado de pedidos de tienda, pendientes con acento ámbar, detalle con «Ver detalles», confirmar y rechazar
- **Realtime / refresco:** listados de productos y ventas alineados tras reserva, entrada, confirm y reject (Appwrite RT + fan-out local; Pulse si está configurado)
- **Usuarios:** listado sin anónimos vacíos; purge de anónimos (límites free plan)
- **Categorías, promos, support inbox, ajustes** (soporte operativo; no bloquean el DoD de stock)
- **Reservas (menú):** placeholder de agenda de taller — **fuera** del flujo de ventas B2C

Estado formal y pendientes post-Core 1: [`.roadmap/Core1/MVP_CORE1_STATUS.md`](.roadmap/Core1/MVP_CORE1_STATUS.md)

---

## Stack

- **Svelte 5** + **Vite** + TypeScript  
- **Appwrite** (Auth, Databases, Realtime, Functions)  
- **Pulse / Pusher** (opcional, fan-out cross-device)  
- Deploy típico: **Render** (web service) + workers auxiliares (ver `DEPLOYMENT.md`)

---

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar VITE_APPWRITE_* y opcionales Pulse
npm run dev
```

Scripts útiles:

```bash
npm run check        # svelte-check + tsc
npm run test:unit    # vitest unit
npm run build        # producción
npm run ci           # check + unit + build
```

No commitear `.env`. Plantilla: `.env.example`.

---

## Roadmap Core 1 (documentación)

| Documento | Descripción |
|-----------|-------------|
| [`.roadmap/Core1/README.md`](.roadmap/Core1/README.md) | Índice de fases 7.x |
| [`.roadmap/Core1/PHASE_7_3_CORE1_DOD.md`](.roadmap/Core1/PHASE_7_3_CORE1_DOD.md) | Definition of Done + registro de cierre |
| [`.roadmap/Core1/QA_CORE1_CHECK_plan.md`](.roadmap/Core1/QA_CORE1_CHECK_plan.md) | Checklist QA ~15 min (sesión 2026-08-12) |
| [`.roadmap/Core1/SMOKE_6_2.md`](.roadmap/Core1/SMOKE_6_2.md) | Smoke confirm / reject |
| [`.roadmap/Core1/ALIGNMENT_WITH_ALEJOTALLER.md`](.roadmap/Core1/ALIGNMENT_WITH_ALEJOTALLER.md) | Alineación con monorepo |

---

## Deploy

Ver [`DEPLOYMENT.md`](./DEPLOYMENT.md) (Render, Cloudflare Workers para Google auth / infra status, variables de entorno).

---

## Pendiente no bloqueante (post–Core 1)

1. Validar §6 QA con cuenta **viewer** (solo lectura stock/ventas).  
2. Core 2 / agenda de **Reservas** de taller (sustituir placeholder).  
3. Deuda cosmética de UI y hardening de env en deploys.  
4. Ampliar E2E automatizado tienda ↔ dash cuando el monorepo lo priorice.

---

## Licencia / uso

Proyecto privado de operación de **Alejo Taller**. Código y políticas de negocio alineados con el monorepo cliente/operador.
