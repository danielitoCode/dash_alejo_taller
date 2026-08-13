import { describe, expect, it } from "vitest"
import { cogsForLine } from "../../../../core/feature/finance/domain/entity/SaleFinanceEvent"
import { shouldUpdateLastUnitCost } from "../../../../core/feature/purchase/domain/entity/PurchaseEntry"

describe("cogsForLine (Core 2 last unit cost)", () => {
    it("uses lastUnitCost × qty", () => {
        expect(cogsForLine(10, 3)).toBe(30)
    })
    it("returns 0 when no cost", () => {
        expect(cogsForLine(undefined, 5)).toBe(0)
        expect(cogsForLine(null, 5)).toBe(0)
    })
    it("returns 0 for invalid qty", () => {
        expect(cogsForLine(10, 0)).toBe(0)
        expect(cogsForLine(10, -1)).toBe(0)
    })
})

describe("shouldUpdateLastUnitCost", () => {
    it("true only for purchase with unitCost > 0", () => {
        expect(shouldUpdateLastUnitCost({ concept: "purchase", unitCost: 5 })).toBe(true)
        expect(shouldUpdateLastUnitCost({ concept: "purchase", unitCost: 0 })).toBe(false)
        expect(shouldUpdateLastUnitCost({ concept: "royalty", unitCost: 5 })).toBe(false)
    })
})
