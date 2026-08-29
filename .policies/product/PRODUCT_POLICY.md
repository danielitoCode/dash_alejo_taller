# Política de catálogo (Product / Category) — Back-office

Última actualización: 2026-08-28  
Ámbito: **dash Core 1 + Core 3 (moneda / protección precio)**  
Relacionado: [EXCHANGE_POLICY](../exchange/EXCHANGE_POLICY.md)

---

## 1. Principio

> El panel es el canal **primario** de alta y mantenimiento del catálogo que consumen tienda web y Android.

`product.price` y `product.last_unit_cost` se interpretan **siempre en USD** (ver política de exchange).

---

## 2. Producto

Campos mínimos alineados al ecosistema:

| Campo | Regla |
|-------|--------|
| `id` | No vacío |
| `name`, `description` | Requeridos en alta |
| `price` | `>= 0`, **USD** |
| `existence` | entero `>= 0` |
| `reserved` | entero `>= 0`; no edición libre Core 1 |
| `last_unit_cost` | `>= 0` o ausente; **USD**; lo escribe la factura de entrada |
| `category_id` | Válido si se exige categoría |
| `photo_url` | URLs http(s) / data / blob según parser existente |
| `status` | `active` \| `inactive` (si se usa: inactive no debe venderse en tienda) |

- Borrado: preferir inactive o borrado con confirmación; no dejar ventas históricas rotas sin mensaje.
- Imágenes: compresión/upload según infra actual del dash.

### Protección de precio (Core 3)

Si al registrar una entrada `purchase` el costo unitario USD supera el `price` actual, el dominio de compras puede auto-ajustar:

`price = unitCostUSD × 1.30`

y dejar señal visible en el producto. Detalle y UX: [EXCHANGE_POLICY §5](../exchange/EXCHANGE_POLICY.md). Soft-hold no se toca.

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
- [ ] price / last_unit_cost tratados como USD en UI y dominio
- [ ] Badge o indicador si price fue auto-protegido (exchange)
