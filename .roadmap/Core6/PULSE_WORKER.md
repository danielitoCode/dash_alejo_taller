# Core6 — Pulse Worker (Cloudflare)

## Problema
Pusher **subscribe** (WebSocket) funciona desde el browser.  
Pusher **publish** (REST + secret) **no**: CORS + el secret no debe estar en el cliente.

## Solución
Worker `infra/pulse-worker` en `dash_alejo_taller`:

1. Cliente/dash → `POST /pulse/event` con `VITE_ALSET_PULSE_API_KEY`
2. Worker firma y llama a `api-{cluster}.pusher.com`
3. Suscriptores reciben el evento al instante

## Env apps
```
VITE_ALSET_PULSE_BASE_URL=https://alejo-pulse.<account>.workers.dev
VITE_ALSET_PULSE_API_KEY=<mismo que secret PULSE_API_KEY del worker>
VITE_PUSHER_KEY=...          # solo public key (subscribe)
VITE_PUSHER_CLUSTER=mt1
# VITE_PUSHER_SECRETS ya no hace falta en cliente si Pulse está configurado
```

## Deploy
Ver `infra/pulse-worker/README.md`.

## CI
Workflow `.github/workflows/pulse-worker.yml` — tests de firma/auth sin red.

## Poll
Mientras Pulse no esté desplegado, web y dash usan poll Turso (~3.5–4 s) como fallback.
