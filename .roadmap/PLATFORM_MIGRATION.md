# Migración de plataforma — por funcionalidad

**Repo:** `dash_alejo_taller` (back-office)  
**Actualizado:** 2026-09-13  
**Rama:** `Core6`

## Principio

```text
Misma política de aplicación · mismos case uses · misma UI
Solo cambian adapters / plataformas
```

No se reabre el diseño de roles, ventas, stock, finance ni Core 5.  
Cada fase termina con **smoke** bajo las políticas vigentes (`.policies/`, checklists Core 1–5).

### Stack destino

| Funcionalidad | Plataforma |
|---------------|------------|
| Autenticación | **Auth0** |
| Database | **Turso** |
| Files | **Cloudflare R2** |
| Realtime | **Pusher** (alinear publishers al nuevo write path) |

### Orden de implementación (obligatorio)

```text
1. Auth  →  2. Database  →  3. Files  →  4. Realtime (alinear)  →  5. Cortar Appwrite
```

Auth antes que DB (ids de usuario estables).  
DB antes que Files “de verdad” en datos (keys en filas Turso).  
Realtime al final de writes: **commit OK → publish**, mismos canales/eventos de negocio.

---

## Puertos (no cambian de fase a fase)

```text
UI / Domain
    → AuthPort
    → *Repository (Sale, Product, Finance, …)
    → FileStoragePort
    → RealtimePort
         → adapters Auth0 | Turso | R2 | Pusher
```

| Puerto | Contrato mínimo |
|--------|-----------------|
| `AuthPort` | session, token, `getSubject()` = Auth0 `sub` |
| `*Repository` | mismas firmas de dominio; sin tipos Appwrite |
| `FileStoragePort` | `upload/delete(key)`; DB guarda **key**, no URL vendor |
| `RealtimePort` | `publish(channel, event, payload)` tras persistencia OK |

---

## Fase 1 — Autenticación (Auth0)

**Objetivo:** login/sesión/roles del panel sin Appwrite Account.  
**Invariantes:** `canViewCore5Reports`, gates admin/owner/sales, rutas protegidas — misma política.

### Implementación

- [ ] App Auth0 (SPA panel)
- [ ] `Auth0AuthAdapter` detrás de `AuthPort`
- [ ] Mapa `sub` → perfil staff + roles (tabla/local claims; **misma** matriz de roles)
- [ ] Sustituir llamadas Appwrite Account en bootstrap/guards
- [ ] Feature flag o wiring DI: solo auth nueva; DB/files siguen Appwrite hasta fases 2–3

### Smoke (política igual)

- [ ] Login staff OK / logout OK
- [ ] Usuario sin rol staff no entra al panel
- [ ] Owner/admin/sales ven lo que ya debían ver (incl. reportes Core 5 si aplica)
- [ ] Viewer (si existe) sigue sin operaciones de escritura staff

**DoD fase 1:** panel usable solo con Auth0; Appwrite solo para data/files residual.

---

## Fase 2 — Database (Turso)

**Objetivo:** persistencia de dominio en Turso; case uses intactos.  
**Invariantes:** soft-hold no aplica en panel igual que hoy; confirm/reject; `sale_finance_event` snapshot; sin recalcular COGS histórico; cola ops Core 5.

### Implementación

- [ ] Schema SQL = modelo de dominio actual (products, sales, stock, finance, …)
- [ ] `Turso*Repository` por agregado; mappers dominio ↔ filas
- [ ] DI: repos Turso; **aún** se puede leer imágenes desde URLs viejas si hace falta
- [ ] Migración de datos Appwrite → Turso (script; validar conteos)
- [ ] IDs de usuario en filas: preferir `auth_sub` Auth0 (fase 1)

### Smoke (política igual)

- [ ] Listar productos / ventas
- [ ] Confirm venta → estado VERIFIED + finance event (paridad Core 4)
- [ ] Reject → DELETED sin finance indebido
- [ ] Panel finance/ops Core 5: KPIs y cola reaccionan tras sync (aunque RT se alinee en fase 4)
- [ ] Compras/stock según políticas ya cerradas (Core 2–3) si se migran esas tablas

**DoD fase 2:** cero lecturas/escrituras de negocio a Appwrite DB; auth = Auth0.

---

## Fase 3 — Files (Cloudflare R2)

**Objetivo:** medios con URL pública; dominio solo conoce `image_key` + `CDN_BASE`.  
**Invariantes:** catálogo y detalle muestran la misma imagen de negocio; no cambia el modelo Product en UI.

### Implementación

- [ ] Bucket R2 + acceso público (custom domain o r2.dev)
- [ ] `R2FileStorageAdapter`
- [ ] Uploads nuevos solo R2; campo `image_key` en Turso
- [ ] Migración blobs Appwrite → R2; actualizar keys
- [ ] UI: `publicUrl = CDN_BASE + key` (sin fileId Appwrite)

### Smoke (política igual)

- [ ] Listado y detalle de producto: imagen visible por HTTPS público
- [ ] Upload (si el panel sube fotos) persiste y se ve tras refresh
- [ ] Sin 404 masivos respecto al set migrado de prueba

**DoD fase 3:** ningún fileId/endpoint Appwrite Storage en runtime.

---

## Fase 4 — Realtime (alinear Pusher)

**Objetivo:** mismos eventos de negocio; publisher = tras **commit Turso** OK.  
**Invariantes:** canales/payloads compatibles con cliente AT; RT es señal, no verdad.

### Implementación

- [ ] Todo write path staff termina en `RealtimePort.publish` (no hooks Appwrite)
- [ ] Eventos mínimos a preservar: `sale.updated`, stock/product, soporte si aplica
- [ ] Panel: subscribe sigue refrescando stores como hoy
- [ ] Si falta evento: `syncAll` / pull Turso recupera estado

### Smoke (política igual)

- [ ] Confirm en panel → otro cliente/panel ve actualización (o tras focus/sync)
- [ ] Reject igual
- [ ] Sin doble apply destructivo (idempotencia de handlers)
- [ ] Pusher caído: datos correctos tras refresh manual (degradación aceptable)

**DoD fase 4:** ningún realtime Appwrite; Pusher alineado al path Turso.

---

## Fase 5 — Cortar Appwrite

- [ ] Sin SDK Appwrite en producción
- [ ] Env limpio; secretos solo Auth0 / Turso / R2 / Pusher
- [ ] CI verde
- [ ] Smoke regresión corto: login → listar → confirm/reject → imagen → RT o sync

---

## Matriz de humo (resumen)

| Fase | Qué debe seguir igual (política) | Plataforma nueva |
|------|----------------------------------|------------------|
| 1 Auth | Roles y acceso panel | Auth0 |
| 2 DB | Ventas, finance snapshot, ops | Turso |
| 3 Files | Fotos de catálogo | R2 |
| 4 RT | Señales post-mutación | Pusher ← Turso |

---

## Core 6

Citas/agenda **solo** sobre estos puertos (no Appwrite).  
Ver [Core6/](./Core6/).

## Espejo AT

[AlejoTaller PLATFORM_MIGRATION](https://github.com/danielitoCode/AlejoTaller/blob/Core6/.roadmap/PLATFORM_MIGRATION.md)
