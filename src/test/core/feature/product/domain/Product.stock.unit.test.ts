import { describe, it, expect } from "vitest"
import {
    availableStock,
    createProduct,
    type Product,
} from "../../../../../core/feature/product/domain/entity/Product"

function base(overrides: Partial<Product> = {}): Product {
    return {
        id: "p-1",
        name: "P",
        description: "d",
        existence: 10,
        reserved: 2,
        price: 1,
        photoUrl: "",
        categoryId: "c1",
        status: "active",
        ...overrides,
    }
}

describe("Product stock helpers (Core1 fase 1 — CANONICAL_RULES)", () => {
    describe("availableStock", () => {
        it("available = existence − reserved", () => {
            expect(availableStock({ existence: 10, reserved: 3 })).toBe(7)
        })

        it("nunca es negativo si reserved > existence", () => {
            expect(availableStock({ existence: 2, reserved: 5 })).toBe(0)
        })

        it("trata valores no numéricos como 0", () => {
            expect(availableStock({ existence: Number.NaN, reserved: 1 })).toBe(0)
            expect(availableStock({ existence: 5, reserved: Number.NaN })).toBe(5)
        })
    })

    describe("createProduct (invariantes)", () => {
        it("acepta producto válido y normaliza", () => {
            const p = createProduct(base({ existence: 5, reserved: 2 }))
            expect(p.existence).toBe(5)
            expect(p.reserved).toBe(2)
            expect(availableStock(p)).toBe(3)
        })

        it("rechaza id vacío", () => {
            expect(() => createProduct(base({ id: "  " }))).toThrow(/identifier/i)
        })

        it("rechaza precio negativo", () => {
            expect(() => createProduct(base({ price: -1 }))).toThrow(/price/i)
        })

        it("rechaza existence < 0", () => {
            expect(() => createProduct(base({ existence: -1, reserved: 0 }))).toThrow(/existence/i)
        })

        it("rechaza reserved < 0", () => {
            expect(() => createProduct(base({ reserved: -1 }))).toThrow(/reserved/i)
        })

        it("rechaza existence < reserved (política panel)", () => {
            expect(() => createProduct(base({ existence: 1, reserved: 4 }))).toThrow(
                /existence cannot be less than reserved/i
            )
        })
    })
})
