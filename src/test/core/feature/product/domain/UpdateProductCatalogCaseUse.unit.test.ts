import { describe, it, expect } from "vitest"
import { UpdateProductCatalogCaseUse } from "../../../../../core/feature/product/domain/caseuse/UpdateProductCatalogCaseUse"
import { UpdateProductPriceCaseUse } from "../../../../../core/feature/product/domain/caseuse/UpdateProductPriceCaseUse"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"
import { FakeProductRepository } from "../../../../fakes/core/feature/product/FakeProductRepository"

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

describe("UpdateProductCatalogCaseUse (Core1 2.2 / 2.3)", () => {
    it("rechaza existence < reserved re-leído (no el reserved del payload)", async () => {
        const repo = new FakeProductRepository()
        repo.seed(product({ existence: 10, reserved: 4 }))
        const useCase = new UpdateProductCatalogCaseUse(repo)

        // Payload miente reserved=0; autoridad es el seed (4)
        await expect(
            useCase.execute(product({ existence: 2, reserved: 0 }))
        ).rejects.toThrow(/existence.*reserved/i)

        const still = await repo.getById("p-1")
        expect(still?.existence).toBe(10)
        expect(still?.reserved).toBe(4)
    })

    it("permite existence === reserved", async () => {
        const repo = new FakeProductRepository()
        repo.seed(product({ existence: 10, reserved: 4 }))
        const useCase = new UpdateProductCatalogCaseUse(repo)

        const updated = await useCase.execute(
            product({ existence: 4, name: "Renombrado", reserved: 999 })
        )

        expect(updated.existence).toBe(4)
        expect(updated.name).toBe("Renombrado")
        // 2.3: reserved del store no cambia por el patch mentiroso
        expect(updated.reserved).toBe(4)
    })

    it("permite subir existence por encima de reserved", async () => {
        const repo = new FakeProductRepository()
        repo.seed(product({ existence: 4, reserved: 4 }))
        const useCase = new UpdateProductCatalogCaseUse(repo)

        const updated = await useCase.execute(product({ existence: 12 }))
        expect(updated.existence).toBe(12)
        expect(updated.reserved).toBe(4)
    })

    it("no muta reserved aunque el patch traiga otro valor (2.3)", async () => {
        const repo = new FakeProductRepository()
        repo.seed(product({ reserved: 6, existence: 10 }))
        const useCase = new UpdateProductCatalogCaseUse(repo)

        const updated = await useCase.execute(product({ reserved: 1, existence: 10, name: "X" }))
        expect(updated.reserved).toBe(6)
        expect(updated.name).toBe("X")
    })

    it("rechaza precio <= 0", async () => {
        const repo = new FakeProductRepository()
        repo.seed(product())
        const useCase = new UpdateProductCatalogCaseUse(repo)

        await expect(useCase.execute(product({ price: 0 }))).rejects.toThrow(/price/i)
    })

    it("rechaza producto inexistente", async () => {
        const repo = new FakeProductRepository()
        const useCase = new UpdateProductCatalogCaseUse(repo)

        await expect(useCase.execute(product({ id: "missing" }))).rejects.toThrow(/not found/i)
    })
})

describe("UpdateProductPriceCaseUse (delega validación 2.2)", () => {
    it("rechaza bajar existence implícita vía product con stock inválido", async () => {
        const repo = new FakeProductRepository()
        repo.seed(product({ existence: 10, reserved: 5 }))
        const useCase = new UpdateProductPriceCaseUse(repo)

        await expect(
            useCase.execute(9.5, product({ existence: 1, reserved: 0 }))
        ).rejects.toThrow(/existence.*reserved/i)
    })

    it("actualiza precio cuando existence es válida", async () => {
        const repo = new FakeProductRepository()
        repo.seed(product({ existence: 10, reserved: 2, price: 5 }))
        const useCase = new UpdateProductPriceCaseUse(repo)

        await useCase.execute(7.5, product({ existence: 10, price: 5 }))

        const stored = await repo.getById("p-1")
        expect(stored?.price).toBe(7.5)
        expect(stored?.reserved).toBe(2)
    })
})
