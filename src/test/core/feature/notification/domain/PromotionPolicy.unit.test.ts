import { describe, expect, it } from "vitest"
import type { Promotion } from "../../../../../core/feature/notification/domain/entity/Promotion"
import {
    discountPercent,
    effectivePrice,
    resolvePromotionKind,
    validatePromotionForSave,
} from "../../../../../core/feature/notification/domain/policy/PromotionPolicy"

const now = 1_700_000_000_000

function promo(over: Partial<Promotion> & { id: string }): Promotion {
    return {
        title: "T",
        message: "M",
        validFromEpochMillis: now - 1000,
        validUntilEpochMillis: now + 10_000,
        ...over,
    }
}

describe("PromotionPolicy B", () => {
    it("discountPercent", () => {
        expect(discountPercent(100, 80)).toBeCloseTo(20)
        expect(discountPercent(100, 100)).toBe(0)
    })

    it("banner vs product_discount by productId", () => {
        expect(resolvePromotionKind({ productId: null })).toBe("banner")
        expect(resolvePromotionKind({ productId: "p1" })).toBe("product_discount")
    })

    it("effectivePrice uses active promo", () => {
        const list = 100
        const items = [
            promo({
                id: "a",
                productId: "p1",
                oldPrice: 100,
                currentPrice: 70,
            }),
        ]
        expect(effectivePrice(list, "p1", items, now)).toBe(70)
        expect(effectivePrice(list, "p2", items, now)).toBe(100)
    })

    it("rejects second active product_discount", () => {
        const existing = [
            promo({
                id: "a",
                productId: "p1",
                oldPrice: 100,
                currentPrice: 80,
            }),
        ]
        const next = promo({
            id: "b",
            productId: "p1",
            oldPrice: 100,
            currentPrice: 70,
        })
        const errs = validatePromotionForSave(next, existing, now)
        expect(errs.some((e) => e.code === "unique_active")).toBe(true)
    })

    it("allows banner without product", () => {
        const banner = promo({ id: "b", productId: null })
        const errs = validatePromotionForSave(banner, [], now)
        expect(errs.filter((e) => e.code === "productId")).toHaveLength(0)
    })
})
