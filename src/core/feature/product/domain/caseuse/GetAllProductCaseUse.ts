import type {ProductRepository, PaginatedResult} from "../repository/product.repository";
import type {Product} from "../entity/Product";

export class GetAllProductCaseUse {
    constructor(private readonly productRepository: ProductRepository) {}
    async execute(limit: number = 25, offset: number = 0): Promise<PaginatedResult<Product>> {
        return await this.productRepository.getAll(limit, offset)
    }
}