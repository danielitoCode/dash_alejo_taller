import {
    isStockMovementType,
    type StockMovementType,
} from "./enums"

/**
 * Dominio — movimiento formal de inventario (Core 2).
 * No sustituye soft-hold; es traza + balance_after.
 */
export interface StockMovement {
    id: string
    productId: string
    type: StockMovementType
    /** Siempre > 0 */
    quantity: number
    /** existence tras aplicar el movimiento */
    balanceAfter: number
    reason: string
    userId: string
    saleId?: string
    entryId?: string
    createdAtIso?: string
}

export function createStockMovement(input: StockMovement): StockMovement {
    const id = String(input.id || "").trim()
    if (!id) throw new Error("stock movement id is required")

    const productId = String(input.productId || "").trim()
    if (!productId) throw new Error("productId is required")

    if (!isStockMovementType(input.type)) {
        throw new Error(`invalid stock movement type: ${String(input.type)}`)
    }

    const quantity = Math.trunc(Number(input.quantity))
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("quantity must be an integer > 0")
    }

    const balanceAfter = Math.trunc(Number(input.balanceAfter))
    if (!Number.isFinite(balanceAfter) || balanceAfter < 0) {
        throw new Error("balanceAfter must be an integer >= 0")
    }

    const reason = String(input.reason || "").trim()
    if (!reason) throw new Error("reason is required")

    const userId = String(input.userId || "").trim()
    if (!userId) throw new Error("userId is required")

    return {
        id,
        productId,
        type: input.type,
        quantity,
        balanceAfter,
        reason,
        userId,
        saleId: input.saleId ? String(input.saleId) : undefined,
        entryId: input.entryId ? String(input.entryId) : undefined,
        createdAtIso: input.createdAtIso,
    }
}
