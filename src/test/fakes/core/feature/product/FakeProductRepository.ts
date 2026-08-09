import type { Product } from "../../../../../core/feature/product/domain/entity/Product"
import type {
    PaginatedResult,
    ProductRepository,
} from "../../../../../core/feature/product/domain/repository/product.repository"

/**
 * Fake in-memory para tests de case uses de catálogo (Core 1).
 * Simula autoridad de reserved en "remoto".
 */
export class FakeProductRepository implements ProductRepository {
    private readonly byId = new Map<string, Product>()

    seed(product: Product): void {
        this.byId.set(product.id, { ...product })
    }

    async getAll(limit: number, offset: number): Promise<PaginatedResult<Product>> {
        const items = Array.from(this.byId.values())
        return { items: items.slice(offset, offset + limit), total: items.length }
    }

    async getById(id: string): Promise<Product | null> {
        const p = this.byId.get(id)
        return p ? { ...p } : null
    }

    async getByCategory(categoryId: string): Promise<Product[]> {
        return Array.from(this.byId.values()).filter((p) => p.categoryId === categoryId)
    }

    async create(product: Product): Promise<Product> {
        const copy = { ...product }
        this.byId.set(copy.id, copy)
        return { ...copy }
    }

    async update(id: string, product: Partial<Product>): Promise<Product> {
        const current = this.byId.get(id)
        if (!current) throw new Error(`Product with id ${id} not found`)

        const merged: Product = {
            ...current,
            ...product,
            id,
            reserved: product.reserved !== undefined ? product.reserved : current.reserved,
            existence: product.existence !== undefined ? product.existence : current.existence,
        }

        if (merged.existence < merged.reserved) {
            throw new Error(
                `existence (${merged.existence}) cannot be less than reserved (${merged.reserved})`
            )
        }

        this.byId.set(id, merged)
        return { ...merged }
    }

    async delete(id: string): Promise<void> {
        this.byId.delete(id)
    }
}
