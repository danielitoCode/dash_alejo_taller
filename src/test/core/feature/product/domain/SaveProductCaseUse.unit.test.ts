import { describe, it, expect } from "vitest"
import { SaveProductCaseUse } from "../../../../../core/feature/product/domain/caseuse/SaveProductCaseUse"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"
import { FakeProductRepository } from "../../../../fakes/core/feature/product/FakeProductRepository"

function base(overrides: Partial<Product> = {}): Product {
    return {
        id: "p-new",
        name: "Nuevo",
        description: "desc",
        existence: 5,
        reserved: 99,
        price: 10,
        photoUrl: "",
        categoryId: "cat-1",
        status: "active",
        ...overrides,
    }
}

describe("SaveProductCaseUse (Core1 2.1 — alta catálogo)", () => {
    it("fuerza reserved=0 aunque el payload traiga otro valor", async () => {
        const repo = new FakeProductRepository()
        const useCase = new SaveProductCaseUse(repo)

        await useCase.execute(base({ existence: 3, reserved: 7 }))

        const stored = await repo.getById("p-new")
        expect(stored?.reserved).toBe(0)
        expect(stored?.existence).toBe(3)
    })

    it("acepta existence = 0 (producto sin stock inicial)", async () => {
        const repo = new FakeProductRepository()
        const useCase = new SaveProductCaseUse(repo)

        await useCase.execute(base({ existence: 0, reserved: 5 }))

        const stored = await repo.getById("p-new")
        expect(stored?.existence).toBe(0)
        expect(stored?.reserved).toBe(0)
    })

    it("rechaza existence negativa", async () => {
        const repo = new FakeProductRepository()
        const useCase = new SaveProductCaseUse(repo)

        await expect(useCase.execute(base({ existence: -1 }))).rejects.toThrow(/existence/i)
        expect(await repo.getById("p-new")).toBeNull()
    })

    it("rechaza categoryId vacío", async () => {
        const repo = new FakeProductRepository()
        const useCase = new SaveProductCaseUse(repo)

        await expect(useCase.execute(base({ categoryId: "" }))).rejects.toThrow(/categoryId/i)
    })

    it("rechaza precio negativo vía createProduct", async () => {
        const repo = new FakeProductRepository()
        const useCase = new SaveProductCaseUse(repo)

        await expect(useCase.execute(base({ price: -5 }))).rejects.toThrow(/price/i)
    })
})
