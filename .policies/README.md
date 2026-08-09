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
```

## Relación con AlejoTaller

| Tema | Canónico (ecosistema) | Este repo |
|------|----------------------|-----------|
| Soft-hold cliente | `AlejoTaller/.policies/warehouse` | Respeta; no redefine el hold B2C |
| Sale UNVERIFIED/VERIFIED | `AlejoTaller/.policies/sale` | Misma semántica al verificar desde dash |
| Auth visitante tienda | `AlejoTaller/.policies/auth` | **No aplica** al panel |
| Auth staff / roles | — | `.policies/auth` (este repo) |
| Gobierno del panel | — | `.policies/panel` |

## Estado (baseline) — 2026-08-09

| Política | Estado |
|----------|--------|
| Auth staff | Definida (doc); gates a validar en QA |
| Sale (supervisión) | Definida; implementación a alinear con soft-hold |
| Warehouse (panel) | Definida; modelo código aún incompleto (`reserved`) |
| Product | Definida |
| Panel | Definida |

## Regla de oro

1. Si una regla afecta stock o estados de venta **compartidos**, primero alinear con AlejoTaller; el dash **adopta**, no inventa un segundo almacén lógico.
2. Al cambiar comportamiento del panel, actualizar la política **antes o junto** con el código y el checklist Core correspondiente.
