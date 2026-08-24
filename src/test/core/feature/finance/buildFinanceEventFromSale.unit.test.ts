import { describe, it, expect } from "vitest"
import { buildFinanceEventFromSale } from "../../../../core/feature/finance/domain/util/buildFinanceEventFromSale"
import { BuyState } from "../../../../core/feature/sale/domain/entity/enums"
import type { Sale } from "../../../../core/feature/sale/domain/entity/Sale"

describe("buildFinanceEventFromSale (Core2 B4.2)", () => {
    it("calcula COGS con lastUnitCost × qty", () => {
        const sale: Sale = {
            id: "s1",
            date: "2026-08-23T10:00:00.000Z",
            amount: 100,
            currency: "CUP",
            verified: BuyState.VERIFIED,
            products: [
                { productId: "p1", quantity: 2, price: 30 },
                { productId: "p2", quantity: 1, price: 40 },
            ],
            userId: "u1",
        }
        const e = buildFinanceEventFromSale({
            sale,
            userId: "staff1",
            lastUnitCostByProductId: { p1: 10, p2: 5 },
        })
        expect(e.saleId).toBe("s1")
        expect(e.revenue).toBe(100)
        expect(e.cogs).toBe(2 * 10 + 1 * 5)
        expect(e.margin).toBe(100 - 25)
        expect(e.currency).toBe("CUP")
    })
})
