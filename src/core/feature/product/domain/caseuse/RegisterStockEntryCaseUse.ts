import type { Product } from "../entity/Product"
import type { ProductRepository } from "../repository/product.repository"

/**
 * Core 1 — entrada de mercancía por delta (no setea existence absoluto).
 * existence += quantity; reserved no se toca.
 */
export class RegisterStockEntryCaseUse {
    constructor(private readonly productRepository: ProductRepository) {}

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

        return await this.productRepository.update(id, { existence: nextExistence })
    }
}
