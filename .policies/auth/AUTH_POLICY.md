# Política de autenticación y roles (Back-office)

Última actualización: 2026-08-09  
Ámbito: **dash_alejo_taller Core 1**  
No cubre visitante/cliente de la tienda (ver `AlejoTaller/.policies/auth`).

---

## 1. Principio

> Solo usuarios **staff** con rol de negocio (`owner` | `admin` | `sales` | `viewer`) operan el panel.  
> El panel no es canal de compra B2C ni sesión anónima de tienda.

---

## 2. Roles

| Rol | Privilegio | Uso típico |
|-----|------------|------------|
| `owner` | Máximo | Propietario; control total |
| `admin` | Alto | Administración diaria |
| `sales` | Medio | Supervisión ventas/reservas/support |
| `viewer` | Bajo | Solo lectura (dashboard/support) |

Jerarquía (mayor → menor): `owner` > `admin` > `sales` > `viewer`.

Implementación de referencia: `src/core/feature/auth/domain/config/RoleConfig.ts`.

---

## 3. Acceso a rutas (Core 1)

| Ruta lógica | owner | admin | sales | viewer |
|-------------|:-----:|:-----:|:-----:|:------:|
| dashboard | sí | sí | sí | sí |
| support (+ detail) | sí | sí | sí | sí |
| users | sí | sí | no | no |
| product / category | sí | sí | no | no |
| sales (+ detail) / reservation | sí | sí | sí | no |
| promo | sí | sí | no | no |
| settings | sí | sí | no | no |

- URL directa a ruta no permitida → pantalla Unauthorized o redirect a primera ruta permitida.
- `canManageRole(manager, target)`: un staff solo gestiona roles de **menor o igual** jerarquía; `sales`/`viewer` no gestionan usuarios.

---

## 4. Sesión

1. Login con credenciales staff (email/password y/o Google staff según deploy).
2. Sin sesión → Login; no shell de administración.
3. Logout invalida sesión Appwrite del panel.
4. No reutilizar cookie/sesión de la **tienda** como staff automáticamente sin validar labels/rol.

---

## 5. Checklist

- [ ] Gates de ruta alineados a `ROLE_ROUTE_ACCESS`
- [ ] UserManagement solo admin/owner
- [ ] Labels Appwrite coherentes con `ROLE_LABELS`
- [ ] QA A1 del checklist Core 1 dash
