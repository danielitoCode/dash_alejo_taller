# Core 2 — Inventario formal, reportes y endurecimiento (Back-office)

**Estado:** backlog tras cierre QA de Core 1 del dash.  
**No bloquea** el trabajo de alineación Core 1 ni el soft-hold del ecosistema.

## Alcance previsto

| Tema | Descripción |
|------|-------------|
| stock_movements | Escritura y consulta de movimientos desde el panel |
| Ajustes / entradas / devoluciones | Flujos admin con auditoría |
| Reportes | Stock bajo, ventas por periodo, reserved envejecido |
| Observabilidad | Logs estructurados, alertas infra (ampliar InfraStatus) |
| Seguridad | Rotación keys, sin secretos en git, CSP/hosting admin dedicado |
| Realtime panel | Opcional: Appwrite RT para cola de UNVERIFIED |
| Monorepo | Evaluar mover `dash` → `AlejoTaller/admin` sin mezclar SPA con tienda |
| Backend | Function atómica compartida confirm+stock (con operador) |

## Índice

| Archivo | Descripción |
|---------|-------------|
| [MVP_CORE2_BACKLOG.md](./MVP_CORE2_BACKLOG.md) | Fases y micro-tareas Core 2 |

Core 1 dash: [../Core1/](../Core1/)  
Core 2 ecosistema tienda/operador: `AlejoTaller/.roadmap/Core2/`
