import type { Product } from "../entity/Product"
import type { ProductRepository } from "../repository/product.repository"
import { UpdateProductCatalogCaseUse } from "./UpdateProductCatalogCaseUse"

/**
 * Actualiza precio (y resto de campos del product pasado) pasando por
 * la misma validación 2.2: existence >= reserved re-leído.
 */
export class UpdateProductPriceCaseUse {
    private readonly catalogUpdate: UpdateProductCatalogCaseUse

    constructor(private readonly productRepository: ProductRepository) {
        this.catalogUpdate = new UpdateProductCatalogCaseUse(productRepository)
    }

    async execute(newPrice: number, product: Product): Promise<void> {
        await this.catalogUpdate.execute({
            ...product,
            price: newPrice,
        })
    }
}
