import { describe, it, expect, vi } from "vitest"
import { SaveProductCaseUse } from "../../../../../core/feature/product/domain/caseuse/SaveProductCaseUse"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"
import type { ProductRepository } from "../../../../../core/feature/product/domain/repository/product.repository"

function baseProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: "p-test-1",
        name: "Test",
        description: "desc",
        existence: 5,
        reserved: 99, // debe ignorarse en alta
        price: 10,
        photoUrl: "",
        categoryId: "cat-1",
        status: "active",
        ...overrides,
    }
}

describe("SaveProductCaseUse (Core1 2.1)", () => {
    it("fuerza reserved=0 y persiste existence>=0", async () => {
        const create = vi.fn(async (p: Product) => p)
        const repo = { create } as unknown as ProductRepository
        const useCase = new SaveProductCaseUse(repo)

        await useCase.execute(baseProduct({ existence: 3, reserved: 7 }))

        expect(create).toHaveBeenCalledTimes(1)
        const arg = create.mock.calls[0][0] as Product
        expect(arg.reserved).toBe(0)
        expect(arg.existence).toBe(3)
    })

    it("rechaza existence negativa", async () => {
        const create = vi.fn()
        const repo = { create } as unknown as ProductRepository
        const useCase = new SaveProductCaseUse(repo)

        await expect(useCase.execute(baseProduct({ existence: -1 }))).rejects.toThrow(
            /existence/i
        )
        expect(create).not.toHaveBeenCalled()
    })

    it("rechaza categoryId vacío", async () => {
        const create = vi.fn()
        const repo = { create } as unknown as ProductRepository
        const useCase = new SaveProductCaseUse(repo)

        await expect(useCase.execute(baseProduct({ categoryId: "" }))).rejects.toThrow(
            /categoryId/i
        )
        expect(create).not.toHaveBeenCalled()
    })
})
