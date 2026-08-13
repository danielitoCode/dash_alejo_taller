/**
 * Core 2 — tipos de movimiento de stock (collection `stock_movement`).
 * quantity siempre > 0; el signo lo da el type.
 */
export type StockMovementType =
    | "entrada"
    | "salida_venta"
    | "ajuste"
    | "devolucion"

export const STOCK_MOVEMENT_TYPES: readonly StockMovementType[] = [
    "entrada",
    "salida_venta",
    "ajuste",
    "devolucion",
] as const

export function isStockMovementType(value: unknown): value is StockMovementType {
    return (
        typeof value === "string" &&
        (STOCK_MOVEMENT_TYPES as readonly string[]).includes(value)
    )
}
