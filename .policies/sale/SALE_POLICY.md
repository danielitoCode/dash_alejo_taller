# Política de ventas — supervisión Back-office

Última actualización: 2026-08-09  
Ámbito: **dash Core 1**  
Canónico ecosistema: `AlejoTaller/.policies/sale/SALE_POLICY.md`

---

## 1. Principio

> El panel **supervisa y puede verificar/rechazar** pedidos; no sustituye el flujo de creación B2C.  
> Cualquier cambio de estado que afecte stock **debe** obedecer soft-hold (warehouse).

---

## 2. Estados

| Estado | Quién lo crea / cambia | Efecto stock |
|--------|------------------------|--------------|
| `UNVERIFIED` | Cliente (tienda) | `reserved += qty` (ya aplicado al crear) |
| `VERIFIED` | Operador **o** staff dash | Consume: `existence -=`, `reserved -=` |
| `DELETED` | Operador **o** staff dash (rechazo) | Release: `reserved -=` |

Core 1 dash: **no** crear pedidos B2C desde el panel.

---

## 3. Reglas de verificación desde el dash

1. Solo actuar sobre ventas existentes en Appwrite.
2. Confirmar solo si está `UNVERIFIED` (idempotencia si ya `VERIFIED`).
3. Rechazar solo si está `UNVERIFIED`.
4. Tras confirmar/rechazar, el stock en Appwrite queda coherente con warehouse policy.
5. UI muestra **currency** y **amount** del documento Sale (elegidos por el cliente); no forzar símbolo USD ni reconvertir tasa en el panel.
6. Preferible la misma ruta de dominio/atómica que el operador; si el dash usa otro código, el **resultado observable** en Appwrite debe ser equivalente.

---

## 4. Checklist

- [ ] Listado distingue UNVERIFIED / VERIFIED / DELETED
- [ ] Confirmación consume stock una sola vez
- [ ] Rechazo solo libera reserved
- [ ] Currency visible en detalle
- [ ] QA bloque C + E del checklist Core 1 dash
