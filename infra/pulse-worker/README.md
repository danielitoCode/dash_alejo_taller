# Alejo Pulse Worker (Cloudflare)

Proxy **server-side** para publicar eventos en Pusher Channels.  
Los clientes (web + dash) ya llaman `POST {VITE_ALSET_PULSE_BASE_URL}/pulse/event` con `VITE_ALSET_PULSE_API_KEY`.

## Deploy

```bash
cd infra/pulse-worker
npm install
npx wrangler login

# Secrets (una vez)
npx wrangler secret put PULSE_API_KEY      # mismo valor que VITE_ALSET_PULSE_API_KEY
npx wrangler secret put PUSHER_APP_ID
npx wrangler secret put PUSHER_KEY
npx wrangler secret put PUSHER_SECRET
npx wrangler secret put PUSHER_CLUSTER    # mt1

# Opcional: orígenes prod
# wrangler.toml [vars] ALLOWED_ORIGINS = "...,https://tu-dominio.com"

npx wrangler deploy
```

Copia la URL (`https://alejo-pulse.<subdomain>.workers.dev`) a:

- Web + dash local/prod: `VITE_ALSET_PULSE_BASE_URL=https://alejo-pulse....workers.dev`
- `VITE_ALSET_PULSE_API_KEY=<mismo PULSE_API_KEY>`

## Contrato

```http
POST /pulse/event
Authorization: Bearer <PULSE_API_KEY>
Content-Type: application/json

{ "channel": "sale-updates", "event": "sale:created", "data": { "saleId": "..." } }
```

```http
GET /health → { "ok": true }
```

## CI

`npm test` valida MD5, firma HMAC y auth/CORS sin llamar a Pusher.
