# Turso dash — CRUD catálogo + factura entrada

## Env

```env
VITE_AUTH_PROVIDER=auth0
VITE_DATA_PROVIDER=turso
VITE_TURSO_URL=...
VITE_TURSO_AUTH_TOKEN=...   # R/W en dash (dev)
VITE_ADMIN_EMAILS=danielovitch96@gmail.com
```

## Flujo

1. Login Auth0 → allowlist admin → panel.
2. Crear **categoría** (si no hay).
3. Crear **producto** (`photo_url` puede ir vacío).
4. Registrar **factura de entrada** (mismo use case que Appwrite) → stock + movement + last_unit_cost.
5. En web cliente (`VITE_DATA_PROVIDER=turso`): recargar → producto visible.

## Sin

- Fotos (R2 pendiente)
- Realtime
- Soft-hold ventas (fase siguiente)

## Install

```powershell
npm i
npm run dev
```
