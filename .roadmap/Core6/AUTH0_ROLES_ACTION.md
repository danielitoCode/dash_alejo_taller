# Auth0 roles — app_metadata.role + Action (paridad labels Appwrite)

## Principio

| Antes (Appwrite) | Ahora (Auth0) |
|------------------|---------------|
| Labels en la cuenta | `app_metadata.role` (**un solo** rol) |
| Cliente lee labels | Cliente **solo** lee claim firmado en el token |

**Nunca** confiar en `app_metadata` en el browser.  
Fuente en Auth0: `role` (string). El SPA/dash solo ve el JWT.

Claim canónico:

```text
https://alejotaller.app/roles
```

(El claim puede ser string `"admin"` o array de un elemento; el adapter normaliza a lista interna.)

Valores: `owner` | `admin` | `sales` | `operator` (alias sales) | `viewer`

---

## 1. app_metadata del usuario

Auth0 → User → **App Metadata**:

```json
{
  "role": "admin"
}
```

Un único rol por cuenta (no array).

---

## 2. Action Post-Login

```javascript
/**
 * Post-Login: app_metadata.role → claim namespaced.
 */
exports.onExecutePostLogin = async (event, api) => {
  const CLAIM = "https://alejotaller.app/roles";

  const raw = event.user.app_metadata && event.user.app_metadata.role;
  let role = "";
  if (typeof raw === "string") {
    role = raw.trim().toLowerCase();
  } else if (Array.isArray(raw) && raw.length > 0) {
    // compat por si alguien dejó el array antiguo
    role = String(raw[0]).trim().toLowerCase();
  }

  // Opcional: primer rol nativo Auth0 si no hay app_metadata.role
  if (!role && event.authorization && Array.isArray(event.authorization.roles) && event.authorization.roles.length) {
    role = String(event.authorization.roles[0]).trim().toLowerCase();
  }

  if (!role) return;

  api.idToken.setCustomClaim(CLAIM, role);
  api.accessToken.setCustomClaim(CLAIM, role);
};
```

Deploy → flujo **Login** → Apply. Tras cambiar metadata → **re-login**.

---

## 3. Adapter

1. Lee solo `https://alejotaller.app/roles` del access token (y del ID token si aplica).
2. Si el claim es string → un rol; si es array → se normaliza (dominio interno sigue usando `roles[]`).
3. No lee `app_metadata` en el cliente.
4. Bootstrap: `VITE_ADMIN_EMAILS` / `VITE_ADMIN_SUBJECTS` (temporal).

---

## 4. Checklist

- [ ] Action con `app_metadata.role`
- [ ] Staff: `{ "role": "admin" }`
- [ ] Re-login → log `roles=[admin]`
- [ ] Quitar allowlist cuando el claim esté estable
