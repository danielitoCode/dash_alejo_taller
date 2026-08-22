import type { StockMovementRepository } from "../../../inventory/domain/repository/stock-movement.repository"
import { createStockMovement } from "../../../inventory/domain/entity/StockMovement"
import type { Product } from "../entity/Product"
import type { ProductRepository } from "../repository/product.repository"

export type ResolveStaffUserId = () => Promise<string>

export type RegisterStockAdjustmentInput = {
    productId: string
    /** Delta entero ≠ 0. Positivo suma, negativo resta. */
    delta: number
    /** Motivo obligatorio (auditoría). */
    reason: string
}

/**
 * Core 2 B3.3 — ajuste auditado de existencia.
 * existence += delta; reserved no se toca.
 * Escribe stock_movements tipo `ajuste` con balance_after y reason.
 * Fallo de movement: soft-fail (stock ya aplicado).
 */
export class RegisterStockAdjustmentCaseUse {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly movementRepository: StockMovementRepository,
        private readonly resolveUserId: ResolveStaffUserId = async () => "staff"
    ) {}

    async execute(input: RegisterStockAdjustmentInput): Promise<Product> {
        const id = String(input.productId || "").trim()
        if (!id) throw new Error("product id is required")

        const reason = String(input.reason || "").trim()
        if (!reason) throw new Error("El motivo del ajuste es obligatorio")

        const deltaRaw = Number(input.delta)
        if (!Number.isFinite(deltaRaw) || deltaRaw === 0) {
            throw new Error("El delta de ajuste debe ser un entero distinto de 0")
        }
        const delta = Math.trunc(deltaRaw)
        if (delta !== deltaRaw || delta === 0) {
            throw new Error("El delta de ajuste debe ser un entero distinto de 0")
        }

        const current = await this.productRepository.getById(id)
        if (!current) throw new Error(`Product with id ${id} not found`)

        const reserved = Number(current.reserved) || 0
        const existence = Number(current.existence) || 0
        const nextExistence = existence + delta

        if (nextExistence < 0) {
            throw new Error(
                `existence no puede ser negativa (${existence} + ${delta} = ${nextExistence})`
            )
        }
        if (nextExistence < reserved) {
            throw new Error(
                `existence (${nextExistence}) cannot be less than reserved (${reserved})`
            )
        }

        const updated = await this.productRepository.update(id, { existence: nextExistence })

        try {
            const userId = (await this.resolveUserId()).trim() || "staff"
            const movement = createStockMovement({
                id: crypto.randomUUID(),
                productId: id,
                type: "ajuste",
                quantity: Math.abs(delta),
                balanceAfter: nextExistence,
                reason: delta > 0 ? `ajuste_pos: ${reason}` : `ajuste_neg: ${reason}`,
                userId,
            })
            await this.movementRepository.create(movement)
        } catch (err) {
            console.error(
                `[RegisterStockAdjustment] stock ok productId=${id} existence=${nextExistence}; movement failed`,
                err
            )
        }

        return updated
    }
}
