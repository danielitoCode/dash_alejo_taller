# Migración de plataforma — stack desacoplado

**Repo:** `dash_alejo_taller` (back-office)  
**Actualizado:** 2026-09-13  
**Rama de trabajo sugerida:** `Core6` (o rama `infra/platform-migration` si se separa)

## Objetivo

Salir del monolito Appwrite (auth + DB + files + realtime en un solo vendor) hacia servicios **independientes**, de forma que cada capa se pueda migrar o cambiar de plan sin reescribir dominio ni UI.

| Capa | Destino | Free (orden de magnitud) |
|------|---------|---------------------------|
| Auth | **Auth0** | ~25 000 MAU |
| Files | **Cloudflare R2** | ~10 GB, egress $0, URL pública |
| DB | **Turso** | ~5 GB |
| Realtime | **Pusher** (ya en uso / mantener) | señal, no fuente de verdad |

**Regla:** Turso **no** sustituye realtime hacia el cliente. Tras un write OK → publicar en Pusher. Si se pierde el evento → `sync`/pull desde Turso.

---

## Puertos (dominio estable)

La UI y los case uses solo dependen de **puertos**. Appwrite, Auth0, Turso, R2 y Pusher viven solo en **adapters** en `data` / `infrastructure`.

```text
Presentation / Domain (case uses)
        │
        ▼
   Ports (interfaces)
        │
        ├── AuthPort
        ├── SaleRepository, ProductRepository, … (persistencia)
        ├── FileStoragePort
        └── RealtimePort
                │
                ▼
        Adapters (intercambiables)
                ├── Auth0AuthAdapter
                ├── Turso*Repository
                ├── R2FileStorageAdapter
                └── PusherRealtimeAdapter
```

### Contratos mínimos sugeridos

**`AuthPort`**

- `getSession()` / `getAccessToken()`
- `login*` / `logout`
- `getSubject(): string` → id estable (`sub` de Auth0) para FK en DB

**`FileStoragePort`**

- `upload(key, bytes, contentType) → void`
- `delete(key) → void`
- **No** devolver URL absoluta del vendor como única verdad: en DB guardar `image_key`; en app `publicUrl = CDN_BASE + key`

**`RealtimePort`**

- `publish(channel, event, payload)`
- Suscripción queda en presentation (Pusher client); el puerto de escritura es lo crítico en panel

**Repositorios de dominio** (`SaleRepository`, etc.)

- Misma firma que hoy; implementación Turso con SQL/libSQL
- Mappers DTO ↔ entidad de dominio **sin** tipos de Appwrite en dominio

---

## Orden de migración (obligatorio)

```text
1. Auth0  →  2. R2  →  3. Turso  →  4. Cortar Appwrite
```

No invertir: si mueves DB antes que auth, los `userId` de Appwrite quedan huérfanos respecto a Auth0.

### Fase 1 — Auth0

- [ ] Tenant Auth0 (app SPA panel + M2M si hace falta)
- [ ] Adapter `Auth0AuthAdapter` detrás de `AuthPort`
- [ ] Mapear `sub` → perfil staff local (roles panel: owner/admin/sales)
- [ ] Login/logout panel sin Appwrite Account
- [ ] Gates de rol siguen leyendo **tu** modelo de roles, no metadata mágica de Appwrite
- [ ] Smoke: login staff → rutas protegidas OK

### Fase 2 — Cloudflare R2

- [ ] Bucket + dominio público (o `*.r2.dev` en dev)
- [ ] `R2FileStorageAdapter` (API S3-compatible)
- [ ] Uploads nuevos de productos/medios solo a R2
- [ ] DB/campos: `image_key` (o migrar URLs Appwrite → key + `CDN_BASE`)
- [ ] Script opcional: copiar blobs Appwrite → R2
- [ ] Smoke: imagen visible por URL pública en listados

### Fase 3 — Turso

- [ ] DB Turso + schema SQL alineado al dominio (sales, products, finance events, appointments Core6, …)
- [ ] Adapters `Turso*Repository` por agregado
- [ ] Escrituras críticas: **commit Turso → luego** `RealtimePort.publish`
- [ ] Lecturas: repositorios; realtime solo invalida/refresca store
- [ ] Migración de datos Appwrite → Turso (export/import por colección)
- [ ] Smoke: CRUD ventas/productos/confirm-reject + panel finance/ops

### Fase 4 — Cortar Appwrite

- [ ] Ningún import de SDK Appwrite en runtime de producción
- [ ] Env sin endpoint/project Appwrite
- [ ] CI verde sin mocks Appwrite obligatorios (o mocks solo en tests legacy marcados)
- [ ] Doc de runbook: cómo rotar Auth0 / R2 / Turso / Pusher por separado

---

## Realtime (Pusher)

| Evento ejemplo | Cuándo publicar |
|----------------|-----------------|
| `sale.updated` | Tras confirm/reject OK en Turso |
| `product.stock` | Tras mutación de stock OK |
| `appointment.*` | Tras cambios Core 6 OK |

Cliente (AT) y panel se suscriben; **fuente de verdad = Turso**.

---

## Relación con Core 6

Core 6 (taller/reservas) debe nacer ya sobre estos puertos si la migración está en curso:

- `AppointmentRepository` → Turso
- Fotos/adjuntos de cita (si hay) → R2
- Avisos de agenda → Pusher
- Identidad staff → Auth0 `sub`

Evitar implementar citas contra Appwrite “temporal”.

---

## Espejo

Cliente/operador: [AlejoTaller `PLATFORM_MIGRATION.md`](https://github.com/danielitoCode/AlejoTaller/blob/Core6/.roadmap/PLATFORM_MIGRATION.md)
