import type { StockMovementRepository } from "../../../inventory/domain/repository/stock-movement.repository"
import { createStockMovement } from "../../../inventory/domain/entity/StockMovement"
import type { Product } from "../entity/Product"
import type { ProductRepository } from "../repository/product.repository"

export type ResolveStaffUserId = () => Promise<string>

/**
 * Core 1 + Core 2 B3.1 — entrada de mercancía por delta.
 * existence += quantity; reserved no se toca.
 * Tras el update escribe stock_movements tipo `entrada` (balance_after).
 * Fallo de movement: soft-fail (stock ya aplicado; auditoría no bloquea).
 */
export class RegisterStockEntryCaseUse {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly movementRepository: StockMovementRepository,
        private readonly resolveUserId: ResolveStaffUserId = async () => "staff"
    ) {}

    async execute(productId: string, quantity: number): Promise<Product> {
        const id = String(productId || "").trim()
        if (!id) throw new Error("product id is required")

        const qty = Number(quantity)
        if (!Number.isFinite(qty) || qty <= 0) {
            throw new Error("La cantidad de entrada debe ser un número mayor que 0")
        }
        const units = Math.floor(qty)
        if (units !== qty || units <= 0) {
            throw new Error("La cantidad de entrada debe ser un entero mayor que 0")
        }

        const current = await this.productRepository.getById(id)
        if (!current) throw new Error(`Product with id ${id} not found`)

        const reserved = Number(current.reserved) || 0
        const existence = Number(current.existence) || 0
        const nextExistence = existence + units

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
                type: "entrada",
                quantity: units,
                balanceAfter: nextExistence,
                reason: "dar_entrada",
                userId,
            })
            await this.movementRepository.create(movement)
        } catch (err) {
            console.error(
                `[RegisterStockEntry] stock ok productId=${id} existence=${nextExistence}; movement failed`,
                err
            )
        }

        return updated
    }
}
