# Cloudflare Worker: Infra Status

Endpoint simple para que el Dashboard consuma el estado de:

- Appwrite (health)
- Render (servicios)
- Cloudflare (Workers/Pages)

Este Worker existe para **no exponer API keys/tokens en el frontend**.

## Variables (Cloudflare)

### CORS
- `CORS_ORIGIN` (ej: `http://localhost:5173` o tu dominio prod)

### Appwrite
- `APPWRITE_ENDPOINT` (ej: `https://cloud.appwrite.io/v1`)
- (opcional) `APPWRITE_CONSOLE_URL`

### Render
- `RENDER_API_KEY` (Bearer token)
- `RENDER_SERVICE_IDS` (CSV: `srv-xxx,srv-yyy`)
- (opcional) `RENDER_CONSOLE_URL`

### Cloudflare
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CF_WORKER_NAMES` (CSV, opcional)
- `CF_PAGES_PROJECT_NAMES` (CSV, opcional)
- (opcional) `CLOUDFLARE_CONSOLE_URL`

## Frontend

En el `.env` del dashboard:

- `VITE_INFRA_STATUS_URL=https://<tu-worker>/`

