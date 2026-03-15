# Appwrite Function: Password Reset (código por email)

Envía un **código** al email del usuario autenticado y permite cambiar la contraseña sin conocer la anterior.

## Variables de entorno

- `APPWRITE_FUNCTION_API_ENDPOINT`
- `APPWRITE_FUNCTION_PROJECT_ID`
- `APPWRITE_FUNCTION_API_KEY` (permisos Users: read, update password, update prefs)

SMTP Gmail (recomendado con App Password):

- `GMAIL_FROM` (ej: `tucorreo@gmail.com`)
- `GMAIL_APP_PASSWORD` (App Password de Google, no tu password normal)
- `GMAIL_REPLY_TO` (opcional)

Opcional:

- `PASSWORD_RESET_TTL_SECONDS=600` (10 minutos por defecto)
- `PASSWORD_RESET_SALT` (si no se define, se usa projectId)

## Entrada (createExecution)

### 1) Solicitar código

```json
{ "action": "request" }
```

### 2) Confirmar y cambiar contraseña

```json
{ "action": "confirm", "code": "123456", "newPassword": "NuevaPassSegura123" }
```

## Seguridad

- Solo funciona si hay usuario autenticado (usa `x-appwrite-user-id`).
- El código se guarda como **hash** en `prefs.password_reset`.

