# Backoffice Core6 — Auth0 + Turso (Appwrite desconectado)

## Auth

| Antes | Ahora |
|-------|--------|
| Appwrite session + Google One Tap | **Auth0 Database** (`Username-Password-Authentication`) |
| Google en Login.svelte | **Eliminado** del panel |
| Splash → Account Appwrite | Solo Auth0 |

Default: `resolveAuthProvider()` → **auth0** salvo `VITE_AUTH_PROVIDER=appwrite`.

### Flujo login

1. Usuario escribe correo en el panel.
2. Redirect a Auth0 Universal Login con `connection=Username-Password-Authentication` + `login_hint`.
3. Auth0 pide contraseña (Database users).
4. Callback → Splash → claim `role` → `canAccessDashboard`.

### Auth0 Dashboard (panel app)

1. Application (SPA dash) → Connections: **habilitar Database**, **deshabilitar Google** si no quieres verlo en Universal Login.
2. Users: crear staff con email/password en Database.
3. `app_metadata`: `{ "role": "admin" }` + Action Post-Login (ver AUTH0_ROLES_ACTION.md).
4. Allowlist temporal: `VITE_ADMIN_EMAILS=tu@mail.com`.

## Datos

```env
VITE_AUTH_PROVIDER=auth0
VITE_DATA_PROVIDER=turso
VITE_TURSO_URL=...
VITE_TURSO_AUTH_TOKEN=...
VITE_AUTH0_DOMAIN=...
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_LOGOUT_RETURN_TO=http://localhost:5173
```

Product/category ya conmutan a Turso vía `isTursoDataProvider()`.

## Aún no migrado

- Pusher / realtime
- File storage (R2)
- Support / sales / promo si aún apuntan a Appwrite → no invocar en camino caliente o fallarán hasta Turso adapters

Código Appwrite **no se borra**; queda detrás del flag.
