import { describe, it, expect, vi } from "vitest"
import { UpdateProductCatalogCaseUse } from "../../../../../core/feature/product/domain/caseuse/UpdateProductCatalogCaseUse"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"
import type { ProductRepository } from "../../../../../core/feature/product/domain/repository/product.repository"

function product(overrides: Partial<Product> = {}): Product {
    return {
        id: "p-1",
        name: "Item",
        description: "d",
        existence: 10,
        reserved: 4,
        price: 5,
        photoUrl: "",
        categoryId: "c1",
        status: "active",
        ...overrides,
    }
}

describe("UpdateProductCatalogCaseUse (Core1 2.2)", () => {
    it("rechaza existence < reserved del producto re-leído", async () => {
        const getById = vi.fn(async () => product({ existence: 10, reserved: 4 }))
        const update = vi.fn()
        const repo = { getById, update } as unknown as ProductRepository
        const useCase = new UpdateProductCatalogCaseUse(repo)

        await expect(
            useCase.execute(product({ existence: 2, reserved: 0 }))
        ).rejects.toThrow(/existence.*reserved/i)

        expect(update).not.toHaveBeenCalled()
    })

    it("permite existence === reserved y no envía reserved en el patch", async () => {
        const current = product({ existence: 10, reserved: 4 })
        const getById = vi.fn(async () => current)
        const update = vi.fn(async (_id: string, patch: Partial<Product>) => ({
            ...current,
            ...patch,
            reserved: current.reserved,
        }))
        const repo = { getById, update } as unknown as ProductRepository
        const useCase = new UpdateProductCatalogCaseUse(repo)

        await useCase.execute(product({ existence: 4, name: "Nuevo", reserved: 999 }))

        expect(update).toHaveBeenCalledTimes(1)
        const patch = update.mock.calls[0][1] as Partial<Product>
        expect(patch.existence).toBe(4)
        expect(patch.name).toBe("Nuevo")
        expect(patch.reserved).toBeUndefined()
    })

    it("rechaza precio <= 0", async () => {
        const getById = vi.fn(async () => product())
        const update = vi.fn()
        const repo = { getById, update } as unknown as ProductRepository
        const useCase = new UpdateProductCatalogCaseUse(repo)

        await expect(useCase.execute(product({ price: 0 }))).rejects.toThrow(/price/i)
        expect(update).not.toHaveBeenCalled()
    })
})
