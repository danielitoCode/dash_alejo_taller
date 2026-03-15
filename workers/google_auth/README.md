# Cloudflare Worker: Google Auth (sin sleep)

Este Worker reemplaza la Function `google_auth` para evitar *cold starts* en el login.

## Qué hace

- Recibe `credential` (Google ID Token, GSI) desde el frontend.
- Verifica el token contra JWKS de Google (firma, exp, issuer, audience).
- Busca (o crea si `allowCreate=true`) el usuario en Appwrite por email.
- **No usa `sub` como contraseña**: valida vínculo comparando `prefs.sub` con el `sub` del token.
- Si el vínculo coincide, genera `Users.createToken` y devuelve `{ userId, secret }`.
- El frontend crea sesión con `account.createSession(userId, secret)`.

## Variables (Worker)

En Cloudflare → Settings → Variables:

- `APPWRITE_ENDPOINT` (ej: `https://cloud.appwrite.io/v1`)
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server key con permisos de Users)
- `GOOGLE_CLIENT_ID` (Web client id)
- `CORS_ORIGIN` (opcional, ej: `https://tu-dominio.com`)

## Request

`POST /` con JSON:

```json
{ "action": "exchange", "credential": "<ID_TOKEN>", "allowCreate": false }
```

## Response

```json
{ "success": true, "kind": "session", "userId": "...", "secret": "...", "email":"...", "sub":"..." }
```

O `kind: link_required | register_required`.

## Deploy

Desde `workers/google_auth`:

- `npm i`
- `npx wrangler deploy`
