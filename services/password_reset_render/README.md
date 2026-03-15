# Render Service: Password Reset (Gmail SMTP)

Servicio Node (Express) para enviar código por Gmail SMTP y cambiar contraseña en Appwrite.

## Variables de entorno (Render)

- `APPWRITE_ENDPOINT` (ej: `https://cloud.appwrite.io/v1`)
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server key con permisos Users: get/updatePassword/updatePrefs)
- `GMAIL_FROM`
- `GMAIL_APP_PASSWORD`
- `PASSWORD_RESET_TTL_SECONDS=600` (opcional)
- `PASSWORD_RESET_SALT` (opcional)

## Cómo autentica al usuario

El frontend debe enviar un JWT de Appwrite en el header:

- `x-appwrite-user-jwt: <JWT>`

El servicio usa ese JWT para identificar al usuario (`account.get()`), y luego usa la `APPWRITE_API_KEY` para ejecutar el cambio.

## Endpoints

`POST /password-reset/request`

`POST /password-reset/confirm`

Body JSON:

```json
{ "code": "123456", "newPassword": "NuevaPassSegura123" }
```

