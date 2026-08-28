# Políticas — dash_alejo_taller (Back-office)

Documentan **reglas de negocio y de panel** para el gobierno de AlejoTaller.
Complementan (y no contradicen) las políticas canónicas del monorepo de venta/operación.

## Estructura

```
.policies/
  README.md
  auth/          → roles staff y acceso al panel
  sale/          → supervisión y verificación de ventas
  warehouse/     → competencia del panel sobre existence/reserved
  product/       → catálogo admin
  panel/         → políticas propias del back-office (UX, secretos, límites)
  notification/  → promociones (política B)
  exchange/      → tasa CUP/USD, compras multi-moneda, protección de precio
```

## Relación con AlejoTaller

| Tema | Canónico (ecosistema) | Este repo |
|------|----------------------|-----------|
| Soft-hold cliente | `AlejoTaller/.policies/warehouse` | Respeta; no redefine el hold B2C |
| Sale UNVERIFIED/VERIFIED | `AlejoTaller/.policies/sale` | Misma semántica al verificar desde dash |
| Auth visitante tienda | `AlejoTaller/.policies/auth` | **No aplica** al panel |
| Auth staff / roles | — | `.policies/auth` (este repo) |
| Gobierno del panel | — | `.policies/panel` |
| Promociones | — | `.policies/notification` (política B; RT Appwrite) |
| Tasa de mercado (API) | `AlejoTaller/.policies/exchange` + feature `exchange` | Misma API; **compras + snapshot + protección precio** aquí |
| Costos / last_unit_cost | Escrito en dash | USD siempre; ver `.policies/exchange` |

## Estado (baseline) — 2026-08-28

| Política | Estado |
|----------|--------|
| Auth staff | Definida (doc); gates a validar en QA |
| Sale (supervisión) | Definida; implementación a alinear con soft-hold |
| Warehouse (panel) | Definida; modelo código aún incompleto (`reserved`) |
| Product | Definida |
| Panel | Definida |
| Promociones (B) | **Aceptada 2026-08-13** — ver `notification/PROMOTION_POLICY.md` |
| Exchange / moneda compras | **Definida 2026-08-28** — ver `exchange/EXCHANGE_POLICY.md` (código + tests = siguiente) |

## Regla de oro

1. Si una regla afecta stock o estados de venta **compartidos**, primero alinear con AlejoTaller; el dash **adopta**, no inventa un segundo almacén lógico.
2. Al cambiar comportamiento del panel, actualizar la política **antes o junto** con el código y el checklist Core correspondiente.
3. Tasa y moneda de **compras**: canónico de escritura en este repo; tasa de **display** cliente canónica en AlejoTaller (misma API).
