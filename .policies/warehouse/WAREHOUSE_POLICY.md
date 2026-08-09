# Política de almacén — competencia Back-office

Última actualización: 2026-08-09  
Ámbito: **dash Core 1**  
Canónico ecosistema: `AlejoTaller/.policies/warehouse/WAREHOUSE_POLICY.md`

---

## 1. Principio

> El dash **no redefine** soft-hold.  
> `available = existence − reserved`.  
> El panel puede **inspeccionar** stock y **ajustar existence** con restricciones; no usa el carrito B2C.

---

## 2. Competencias del panel (Core 1)

| Acción | ¿Permitido? | Notas |
|--------|-------------|--------|
| Leer existence / reserved / available | Sí | UI admin |
| Crear/editar producto (datos catálogo + existence inicial) | Sí | `reserved` inicia en 0 |
| Incrementar existence (entrada simple) | Sí | Sin tocar reserved |
| Decrementar existence | Sí, si `nuevo_existence >= reserved` | Nunca dejar reserved huérfano |
| Editar `reserved` manualmente | **No** (Core 1) | Reserved solo por hold/release/consume del flujo de ventas |
| Soft-hold al “vender desde admin” | **No** | No hay checkout B2C en panel |
| Verify/reject venta | Sí | Ver SALE_POLICY dash (efectos stock) |

---

## 3. Invariantes

1. `existence >= 0`, `reserved >= 0`.
2. `existence >= reserved` tras cualquier guardado desde el panel.
3. Autoridad: Appwrite; Dexie no es fuente de verdad para mutar stock.
4. Si el panel actualiza existence, la tienda debe poder ver el nuevo available (refresh o RT en clientes).

---

## 4. Core 2 (fuera de alcance actual)

- Movimientos formales, devoluciones post-venta, multi-almacén, function transaccional.

---

## 5. Checklist

- [ ] Modelo Product con reserved en dash
- [ ] UI muestra available
- [ ] Validación existence >= reserved al guardar
- [ ] Verify/reject alineados al canónico
