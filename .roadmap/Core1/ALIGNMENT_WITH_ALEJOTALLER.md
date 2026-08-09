# Alineación dash ↔ AlejoTaller (Core 1)

**Fecha:** 2026-08-09

## Actores del ecosistema

| Superficie | Repo / path | Rol |
|------------|-------------|-----|
| Tienda web | `AlejoTaller/web` | Cliente B2C |
| Tienda Android | `AlejoTaller/app` | Cliente B2C |
| Operador piso | `AlejoTaller/alejotallerscan` | Confirma/rechaza en taller |
| **Back-office** | **`dash_alejo_taller`** | Gobierno: catálogo, roles, supervisión ventas, promos, support |

## Contrato compartido (no negociable en Core 1)

| Concepto | Regla |
|----------|--------|
| `available` | `existence - reserved` (≥ 0) |
| Pedido cliente | Solo `UNVERIFIED` + soft-hold (`reserved += qty`) |
| Confirmación | `VERIFIED` → consume `existence` y libera la parte de `reserved` |
| Rechazo / cancel | `DELETED` o cancel cliente → solo libera `reserved` |
| Currency | Se muestra la del documento `Sale`; no forzar USD en UI admin |
| Autoridad stock | Appwrite; cache Dexie solo para UI |

Fuente: `AlejoTaller/.policies/warehouse/WAREHOUSE_POLICY.md`, `.../sale/SALE_POLICY.md`.

## Gaps conocidos del dash (baseline pre-alineación)

1. `Product` en dash **sin campo `reserved`** → riesgo de UI y sync incompletos.
2. Verificación de venta en dash puede no usar el mismo camino atómico que operador/clientes.
3. Realtime de stock/sale en clientes migró a Appwrite; dash no está obligado a suscribirse en Core 1, pero **sí** a no escribir estados inconsistentes.
4. Último commit de producto ~2026-07-01; políticas AlejoTaller evolucionaron en agosto 2026.
5. `.env` versionado en el repo (deuda de seguridad).

## Competencia del panel vs operador

| Acción | Operador (`alejotallerscan`) | Dash back-office |
|--------|------------------------------|------------------|
| Confirmar/rechazar venta en mostrador | Primario | Secundario (supervisión / respaldo) |
| Misma semántica stock | Sí | **Debe ser idéntica** si se expone |
| CRUD catálogo masivo | No | Sí |
| Gestión de roles staff | No | Sí |
| Promos / support inbox | No / limitado | Sí |
| Soft-hold al crear pedido B2C | No | **No** (solo clientes) |

## Criterio de “alineado Core 1”

- Políticas locales en `.policies/` no contradicen AlejoTaller.
- Modelo producto + flujos verify/reject respetan soft-hold.
- QA del dash en verde + al menos un E2E manual tienda → dash.
