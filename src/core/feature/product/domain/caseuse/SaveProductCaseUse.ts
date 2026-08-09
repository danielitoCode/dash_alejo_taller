import { createProduct, type Product } from "../entity/Product"
import type { ProductRepository } from "../repository/product.repository"

/**
 * Alta de producto (Core 1 / fase 2.1).
 *
 * Reglas congeladas:
 * - existence >= 0
 * - reserved = 0 siempre al crear (el panel no inicia soft-hold)
 * - categoryId obligatorio
 * - resto de invariantes vía createProduct()
 */
export class SaveProductCaseUse {
    constructor(private readonly productRepository: ProductRepository) {}

    async execute(newProduct: Product): Promise<void> {
        if (!newProduct.categoryId || newProduct.categoryId.trim() === "") {
            throw new Error("categoryId is required to create a product")
        }

        const existence = Number(newProduct.existence)
        if (!Number.isFinite(existence) || existence < 0) {
            throw new Error("existence must be a number >= 0")
        }

        // Soft-hold solo lo crean los clientes al pedir; alta de catálogo arranca en 0.
        const normalized = createProduct({
            ...newProduct,
            existence: Math.floor(existence),
            reserved: 0,
        })

        await this.productRepository.create(normalized)
    }
}
