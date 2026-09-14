# Auth0 roles — app_metadata + Action (paridad labels Appwrite)

## Principio

| Antes (Appwrite) | Ahora (Auth0) |
|------------------|---------------|
| Labels en la cuenta | `app_metadata.roles` |
| Cliente lee labels vía Users API / sesión | Cliente **solo** lee claim firmado en el token |

**Nunca** confiar en `app_metadata` leído en el browser ni en roles inventados en el cliente.  
`app_metadata` es fuente de verdad en Auth0; el **token** es lo único que consume el SPA/dash.

Claim canónico (ambos repos):

```text
https://alejotaller.app/roles
```

Valores de negocio: `owner` | `admin` | `sales` | `operator` (alias sales) | `viewer`

---

## 1. app_metadata del usuario

Auth0 Dashboard → User Management → Users → usuario → **Metadata** → App Metadata:

```json
{
  "roles": ["admin"]
}
```

Varios roles:

```json
{
  "roles": ["owner", "admin"]
}
```

Staff mínimo para entrar al panel: `owner`, `admin` o `sales`/`operator`.

---

## 2. Action Post-Login (obligatoria)

Auth0 Dashboard → Actions → Flows → **Login** → Custom → Create Action.

Nombre sugerido: `Inject AlejoTaller roles claim`.

```javascript
/**
 * Post-Login: copia app_metadata.roles → claim namespaced.
 * Sin esta Action el SPA no ve roles de negocio (queda viewer).
 */
exports.onExecutePostLogin = async (event, api) => {
  const CLAIM = "https://alejotaller.app/roles";

  const fromMeta = event.user.app_metadata && event.user.app_metadata.roles;
  let roles = [];

  if (Array.isArray(fromMeta)) {
    roles = fromMeta.map(String).map((r) => r.trim().toLowerCase()).filter(Boolean);
  } else if (typeof fromMeta === "string" && fromMeta.trim()) {
    roles = fromMeta.split(/[\s,]+/).map((r) => r.trim().toLowerCase()).filter(Boolean);
  }

  // Opcional: roles nativos Auth0 Authorization Core (si los usáis además)
  const authz = event.authorization && event.authorization.roles;
  if (Array.isArray(authz) && authz.length) {
    for (const r of authz) {
      const n = String(r).trim().toLowerCase();
      if (n && !roles.includes(n)) roles.push(n);
    }
  }

  if (roles.length === 0) {
    // Cliente B2C sin metadata → sin claim (el adapter trata como viewer)
    return;
  }

  api.idToken.setCustomClaim(CLAIM, roles);
  api.accessToken.setCustomClaim(CLAIM, roles);
};
```

1. Deploy la Action.  
2. Arrastrarla al flujo **Login** (después de las que ya tengáis).  
3. Apply.

Tras cambiar `app_metadata`, el usuario debe **volver a login** (o refresh token) para ver el claim nuevo.

---

## 3. Qué hace el adapter (dash / web)

1. Obtiene access token (JWT firmado por Auth0).
2. Lee **solo** el payload claim `https://alejotaller.app/roles`.
3. **No** lee `user.app_metadata` ni `user.roles` genérico del profile.
4. Fallback de perfil: el mismo claim si Auth0 lo expuso en el ID token (`getUser()`).
5. Bootstrap temporal: `VITE_ADMIN_EMAILS` / `VITE_ADMIN_SUBJECTS` (solo hasta tener Action + metadata en todos los staff). Quitar en producción cuando el claim esté estable.

---

## 4. Checklist

- [ ] Action desplegada y en el flujo Login
- [ ] Staff con `app_metadata.roles` correcto
- [ ] Re-login y log: `roles=[admin]` (o el esperado)
- [ ] Sin claim y sin allowlist → `viewer` → sin acceso al dash
- [ ] Quitar allowlist cuando deje de hacer falta

---

## 5. Roles nativos Auth0 vs app_metadata

| Fuente | Uso recomendado |
|--------|------------------|
| **app_metadata.roles** | Fuente de verdad de negocio (análogo labels) |
| Roles Auth0 RBAC | Opcional; la Action puede unirlos al mismo claim |
| Allowlist env | Solo bootstrap local |

Una sola lista en el token = mismos gates `canAccessDashboard` / `ROLE_ROUTE_ACCESS`.
