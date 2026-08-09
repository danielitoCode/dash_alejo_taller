# Política de catálogo (Product / Category) — Back-office

Última actualización: 2026-08-09  
Ámbito: **dash Core 1**

---

## 1. Principio

> El panel es el canal **primario** de alta y mantenimiento del catálogo que consumen tienda web y Android.

---

## 2. Producto

Campos mínimos alineados al ecosistema:

| Campo | Regla |
|-------|--------|
| `id` | No vacío |
| `name`, `description` | Requeridos en alta |
| `price` | `>= 0` |
| `existence` | entero `>= 0` |
| `reserved` | entero `>= 0`; no edición libre Core 1 |
| `category_id` | Válido si se exige categoría |
| `photo_url` | URLs http(s) / data / blob según parser existente |
| `status` | `active` \| `inactive` (si se usa: inactive no debe venderse en tienda) |

- Borrado: preferir inactive o borrado con confirmación; no dejar ventas históricas rotas sin mensaje.
- Imágenes: compresión/upload según infra actual del dash.

---

## 3. Categoría

- CRUD por admin/owner.
- Eliminar categoría con productos asociados: bloquear o reasignar (definir en UI; no silencio).

---

## 4. Permisos

Solo `owner` / `admin` mutan catálogo (`RoleConfig`).

---

## 5. Checklist

- [ ] Paridad de campos stock con Appwrite / tienda
- [ ] Validaciones price/existence en save
- [ ] Roles respetados
