# Corte Appwrite (Auth0 + Turso)

Con `VITE_AUTH_PROVIDER=auth0` y `VITE_DATA_PROVIDER=turso`:

| Área | Comportamiento |
|------|----------------|
| Account / Session Appwrite | **No** — `sessionStore.getCurrentUser` → Auth0 |
| Splash / NestedNav auth | Solo Auth0 / guest local |
| Catálogo product/category | Turso |
| Promo / sale / support RT | **Skip** (no migrados) |
| Product RT Appwrite | Skip |

Env mínimo web + dash:

```env
VITE_AUTH_PROVIDER=auth0
VITE_DATA_PROVIDER=turso
VITE_TURSO_URL=...
VITE_TURSO_AUTH_TOKEN=...
VITE_AUTH0_DOMAIN=...
VITE_AUTH0_CLIENT_ID=...
```

No hace falta `VITE_APPWRITE_*` para arrancar auth+catálogo.
