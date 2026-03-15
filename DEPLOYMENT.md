# Deploy híbrido (Cloudflare + Render)

## Objetivo

- **Login con Google (one-click)** sin `sub` como contraseña → **Cloudflare Worker** (sin sleep).
- **Reset de contraseña por código (Gmail SMTP)** → **Render Web Service** (puede tener cold start).

---

## 1) Cloudflare Worker: `google_auth`

Código: `workers/google_auth`

### Variables (Cloudflare → Settings → Variables)

- `APPWRITE_ENDPOINT` (ej: `https://cloud.appwrite.io/v1`)
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server key con permisos de Users)
- `GOOGLE_CLIENT_ID` (Web client ID)
- `CORS_ORIGIN` (opcional, tu dominio)

### Deploy

```bash
cd workers/google_auth
npm i
npx wrangler deploy
```

Copia la URL resultante y úsala en el frontend como `VITE_GOOGLE_AUTH_URL`.

---

## 2) Render Web Service: `password_reset`

Código: `services/password_reset_render`

### Variables (Render → Environment)

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `GMAIL_FROM`
- `GMAIL_APP_PASSWORD`
- `PASSWORD_RESET_TTL_SECONDS` (opcional, default 600)
- `PASSWORD_RESET_SALT` (opcional)

### Build/Start (Render)

- **Root Directory**: `services/password_reset_render`
- **Build Command**: `npm ci`
- **Start Command**: `npm start`

URL final (ej: `https://tu-servicio.onrender.com`) se usa en el frontend como `VITE_PASSWORD_RESET_URL`.

---

## 3) Frontend env (`.env`)

Variables requeridas:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_AUTH_URL`
- `VITE_PASSWORD_RESET_URL`

Notas:
- `VITE_GOOGLE_AUTH_URL` debe apuntar al Worker (POST JSON).
- `VITE_PASSWORD_RESET_URL` debe apuntar al servicio Render (POST `/password-reset/*`).

