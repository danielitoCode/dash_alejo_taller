import { describe, expect, it } from "vitest"
import { RegisterStockEntryCaseUse } from "../../../../../core/feature/product/domain/caseuse/RegisterStockEntryCaseUse"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"
import type {
    PaginatedResult,
    ProductRepository,
} from "../../../../../core/feature/product/domain/repository/product.repository"
import type { StockMovement } from "../../../../../core/feature/inventory/domain/entity/StockMovement"
import type { StockMovementRepository } from "../../../../../core/feature/inventory/domain/repository/stock-movement.repository"

function product(partial: Partial<Product> & { id: string }): Product {
    return {
        name: "P",
        description: "",
        price: 10,
        existence: 0,
        reserved: 0,
        photoUrl: "",
        categoryId: "c1",
        status: "active",
        ...partial,
    }
}

class FakeProductRepo implements ProductRepository {
    private store: Map<string, Product>

    constructor(initial: Product[]) {
        this.store = new Map(initial.map((p) => [p.id, p]))
    }

    async getAll(_limit: number, _offset: number): Promise<PaginatedResult<Product>> {
        const items = [...this.store.values()]
        return { items, total: items.length }
    }

    async getById(id: string): Promise<Product | null> {
        return this.store.get(id) ?? null
    }

    async getByCategory(categoryId: string): Promise<Product[]> {
        return [...this.store.values()].filter((p) => p.categoryId === categoryId)
    }

    async create(p: Product): Promise<Product> {
        this.store.set(p.id, p)
        return p
    }

    async update(id: string, patch: Partial<Product>): Promise<Product> {
        const cur = this.store.get(id)
        if (!cur) throw new Error("missing")
        const next = { ...cur, ...patch }
        this.store.set(id, next)
        return next
    }

    async delete(id: string): Promise<void> {
        this.store.delete(id)
    }
}

class FakeMovementRepo implements StockMovementRepository {
    created: StockMovement[] = []
    failNext = false

    async create(movement: StockMovement): Promise<StockMovement> {
        if (this.failNext) throw new Error("appwrite down")
        this.created.push(movement)
        return movement
    }

    async listByProduct(): Promise<StockMovement[]> {
        return []
    }

    async listRecent(): Promise<StockMovement[]> {
        return []
    }
}

describe("RegisterStockEntryCaseUse B3.1", () => {
    it("increments existence and writes entrada movement with balance_after", async () => {
        const products = new FakeProductRepo([product({ id: "p1", existence: 10, reserved: 2 })])
        const movements = new FakeMovementRepo()
        const useCase = new RegisterStockEntryCaseUse(products, movements, async () => "staff-1")

        const updated = await useCase.execute("p1", 5)

        expect(updated.existence).toBe(15)
        expect(movements.created).toHaveLength(1)
        const m = movements.created[0]
        expect(m.type).toBe("entrada")
        expect(m.productId).toBe("p1")
        expect(m.quantity).toBe(5)
        expect(m.balanceAfter).toBe(15)
        expect(m.reason).toBe("dar_entrada")
        expect(m.userId).toBe("staff-1")
    })

    it("rejects non-positive qty", async () => {
        const products = new FakeProductRepo([product({ id: "p1", existence: 1 })])
        const movements = new FakeMovementRepo()
        const useCase = new RegisterStockEntryCaseUse(products, movements)
        await expect(useCase.execute("p1", 0)).rejects.toThrow(/mayor que 0/)
        expect(movements.created).toHaveLength(0)
    })

    it("soft-fails movement: stock still applied", async () => {
        const products = new FakeProductRepo([product({ id: "p1", existence: 3, reserved: 0 })])
        const movements = new FakeMovementRepo()
        movements.failNext = true
        const useCase = new RegisterStockEntryCaseUse(products, movements, async () => "u")

        const updated = await useCase.execute("p1", 2)
        expect(updated.existence).toBe(5)
        expect(movements.created).toHaveLength(0)
    })
})
