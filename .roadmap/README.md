# Roadmap dash_alejo_taller (Back-office)

Panel de administración y gobierno de negocio de **AlejoTaller**.

Este roadmap sigue el mismo estilo de entrega por núcleos que el monorepo
[`AlejoTaller`](https://github.com/danielitoCode/AlejoTaller), acotado al **panel back-office**
(no tienda B2C, no operador de piso móvil).

| Directorio | Alcance |
|------------|---------|
| [`Core1/`](./Core1/) | Alineación con Core 1 de AlejoTaller: roles staff, catálogo con `existence`/`reserved`/`available`, ventas UNVERIFIED→VERIFIED/DELETED sin romper soft-hold, currency del pedido, QA checklist back-office |
| [`Core2/`](./Core2/) | Movimientos de stock formales, ajustes de inventario desde panel, reportes, observabilidad, endurecimiento de secretos/deploy, posible integración monorepo |

**Cómo usar**
- Marca checkboxes `[x]` cuando verifiques en código o QA.
- Core 1 del dash se cierra cuando el panel **respeta** las políticas de warehouse/sale del ecosistema y el checklist QA back-office está en verde.
- Core 2 no bloquea el cierre de Core 1 del dash.

**Políticas de producto (este repo):** [`.policies/`](../.policies/)  
**Fuente canónica de soft-hold (ecosistema):** `AlejoTaller/.policies/warehouse` y `AlejoTaller/.policies/sale`
