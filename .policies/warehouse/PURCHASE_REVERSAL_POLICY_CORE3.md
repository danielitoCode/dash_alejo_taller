# Core 3 — Política de anulación y corrección de entradas

**Fecha:** 2026-08-29  
**Estado:** aceptada para implementación B3 en back-office.

## 1. Alcance

Esta política define cómo se revierten entradas de compras/abastecimiento que ya hayan afectado el inventario.

La anulación pertenece al back-office y queda restringida a **owner/admin**. El cliente B2C y el operador no anulan ni corrigen entradas.

## 2. Inmutabilidad y trazabilidad

- Una entrada confirmada **no se elimina físicamente**.
- Una entrada confirmada no se edita línea a línea para alterar retrospectivamente el movimiento original.
- El contrato B3 usa `purchase_entry.status`: `ACTIVE` → `CANCELLED`.
- Entradas legacy sin `status` se interpretan como `ACTIVE` hasta que sean anuladas.
- La reversión de stock se registra mediante movimientos compensatorios, conservando `entry_id`.
- La reversión usa el tipo existente `ajuste` y `reason = purchase_entry_reversal`; no se introduce un segundo enum de movimiento.
- El historial debe permitir reconstruir la entrada original y su reversión.

## 3. Regla de integridad de inventario

Toda anulación debe preservar:

`existence >= reserved`

Para cada línea:

`new_existence = existence - quantity_to_reverse`

y debe cumplirse:

`new_existence >= reserved`

Si una sola línea incumple la condición, **se rechaza la operación completa**. No se permite una anulación parcial accidental.

## 4. Atomicidad — Appwrite Client SDK

B3 se ejecuta **desde el Client SDK TypeScript del back-office**, sin una Function serverless adicional.

La infraestructura usa `Databases.createTransaction()` y pasa `transactionId` a lecturas/escrituras relacionadas. El commit se realiza mediante `updateTransaction({ commit: true })`; ante error se solicita rollback.

La anulación sigue este orden:

1. Crear transacción.
2. Leer entrada dentro de la transacción.
3. Verificar `ACTIVE`.
4. Leer todas las líneas.
5. Leer todos los productos y validar `existence - quantity >= reserved`.
6. Aplicar los decrementos de stock.
7. Crear movements compensatorios `ajuste / purchase_entry_reversal`.
8. Marcar la entrada `CANCELLED`.
9. Commit.

Si cualquier paso falla, **ningún cambio de stock, movement o estado debe quedar persistido**.

El mismo runner transaccional se reutiliza para el registro de nuevas entradas, eliminando el anterior `soft-fail` de movements.

## 5. Idempotencia y concurrencia

Una entrada `CANCELLED` no puede volver a generar reversals.

La transición válida es:

`ACTIVE → CANCELLED`

Las lecturas y escrituras se realizan dentro de la misma transacción para que Appwrite detecte conflictos concurrentes al commit.

## 6. Anulación completa vs corrección parcial

### B3.1 — Anulación completa

Revierte todas las líneas de la entrada original. El caso de uso transaccional está implementado en el back-office; la habilitación final depende del atributo Appwrite `purchase_entry.status` y de la UI owner/admin.

### B3.2 — Corrección parcial

Queda separada de B3.1. No se edita retrospectivamente la entrada original; se modelará como ajuste compensatorio auditable.

## 7. `last_unit_cost`

La anulación **no modifica `last_unit_cost`**.

No se establece a cero ni se infiere un costo anterior. El operador continúa usando el valor existente para COGS.

## 8. UX y autorización

La acción de anulación:

- solo aparece para `owner/admin`;
- requiere confirmación explícita;
- muestra que revertirá stock;
- informa cuando la operación no puede ejecutarse por unidades reservadas;
- desaparece o queda inactiva cuando la entrada está `CANCELLED`.

## 9. Requisito de schema

Antes de habilitar la operación en producción debe existir en Appwrite `purchase_entry.status` como atributo compatible con `ACTIVE` / `CANCELLED`.

El Client SDK no puede crear/modificar atributos de schema como parte de esta transacción; la provisión del atributo es una operación administrativa separada.

## 10. Regla de diseño

B3 reutiliza el modelo de inventario existente. No introduce un segundo almacén lógico ni una segunda fuente de verdad para `existence`, `reserved`, `available` o COGS.
