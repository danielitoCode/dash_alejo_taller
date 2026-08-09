# Política del panel Back-office

Última actualización: 2026-08-09  
Ámbito: **dash_alejo_taller** (propias del producto admin)

---

## 1. Identidad del producto

| Qué es | Qué no es |
|--------|-----------|
| Gobierno de negocio, catálogo, roles, supervisión | Tienda B2C (`AlejoTaller/web`, `app`) |
| Respaldo de verificación de ventas | Sustituto exclusivo del operador de piso |
| Support / promos / infra status | App de cliente final |

Deploy preferible en **host/dominio distinto** de la tienda pública.

---

## 2. Seguridad

1. **No** versionar `.env` con secretos; solo `.env.example`.
2. **No** versionar `.npm-cache` ni artefactos locales de install.
3. Claves server (Appwrite API key, Gmail, Pulse) solo en Workers/Render/Functions, no en el bundle Vite.
4. Toda mutación privilegiada (usuarios, roles) pasa por backend con privilegio server, no solo SDK anónimo.
5. Sesión staff ≠ sesión cliente; no mezclar permisos de colecciones.

---

## 3. Datos y offline-first

1. Dexie acelera UI; **no** autoriza stock ni verify de ventas.
2. Tras mutaciones críticas, revalidar desde Appwrite.
3. Mensajes de error claros al staff (sin stack traces con secretos).

---

## 4. UX mínima Core 1

1. Shell con navegación según rol (ocultar entradas no permitidas).
2. Detalle de venta legible: estado, currency, líneas, acciones confirmar/rechazar con confirmación explícita.
3. Catálogo: stock available visible para no “vender” mentalmente unidades reserved.

---

## 5. Evolución

- Core 2: reportes, movimientos, posible carpeta `admin/` en monorepo AlejoTaller **sin** fusionar SPA con la tienda.
- Cambios de política compartida (warehouse/sale) se documentan primero en AlejoTaller y se adoptan aquí.

---

## 6. Checklist

- [ ] Higiene de secretos en repo
- [ ] Dominio/deploy admin documentado
- [ ] Navegación por rol
- [ ] Confirmaciones destructivas (verify/reject/delete)
