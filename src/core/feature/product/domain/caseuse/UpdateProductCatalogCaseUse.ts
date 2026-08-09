import type { Product } from "../entity/Product"
import type { ProductRepository } from "../repository/product.repository"

/**
 * Edición de catálogo (Core 1 / fase 2.2).
 *
 * - Re-lee el producto para tomar `reserved` autoritativo (Appwrite/cache).
 * - Exige existence >= reserved.
 * - No permite mutar `reserved` desde el panel (se omite en el patch).
 */
export class UpdateProductCatalogCaseUse {
    constructor(private readonly productRepository: ProductRepository) {}

    async execute(patch: Product): Promise<Product> {
        if (!patch.id?.trim()) {
            throw new Error("product id is required")
        }

        const current = await this.productRepository.getById(patch.id)
        if (!current) {
            throw new Error(`Product with id ${patch.id} not found`)
        }

        const existence = Number(patch.existence)
        if (!Number.isFinite(existence) || existence < 0) {
            throw new Error("existence must be a number >= 0")
        }
        const nextExistence = Math.floor(existence)

        const reserved = Number(current.reserved) || 0
        if (nextExistence < reserved) {
            throw new Error(
                `existence (${nextExistence}) cannot be less than reserved (${reserved})`
            )
        }

        const price = Number(patch.price)
        if (!Number.isFinite(price) || price <= 0) {
            throw new Error("Price must be greater than 0")
        }

        if (!patch.categoryId?.trim()) {
            throw new Error("categoryId is required")
        }

        // Patch de catálogo: reserved no se envía (repo ya usa catalog write DTO).
        return await this.productRepository.update(patch.id, {
            name: patch.name?.trim() || current.name,
            description: patch.description ?? current.description,
            price,
            photoUrl: patch.photoUrl ?? current.photoUrl,
            categoryId: patch.categoryId.trim(),
            status: patch.status === "inactive" ? "inactive" : "active",
            existence: nextExistence,
            // explícitamente no tocamos reserved en el objeto parcial de dominio:
            // el repo conserva current.reserved al mergear si no viene en patch.
        })
    }
}
