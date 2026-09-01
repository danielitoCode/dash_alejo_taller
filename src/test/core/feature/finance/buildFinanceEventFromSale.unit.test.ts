import { describe, it, expect } from "vitest"
import { buildFinanceEventFromSale } from "../../../../core/feature/finance/domain/util/buildFinanceEventFromSale"
import { BuyState } from "../../../../core/feature/sale/domain/entity/enums"
import type { Sale } from "../../../../core/feature/sale/domain/entity/Sale"

describe("buildFinanceEventFromSale (Core4 B1)", () => {
    it("calcula COGS con lastUnitCost × qty y rellena líneas con snapshot", () => {
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
        expect(e.lines).toHaveLength(2)
        expect(e.lines[0]).toMatchObject({
            productId: "p1",
            quantity: 2,
            unitPrice: 30,
            unitCostSnapshot: 10,
            lineRevenue: 60,
            lineCogs: 20,
            lineMargin: 40,
        })
        expect(e.lines[1]).toMatchObject({
            productId: "p2",
            quantity: 1,
            unitPrice: 40,
            unitCostSnapshot: 5,
            lineRevenue: 40,
            lineCogs: 5,
            lineMargin: 35,
        })
    })

    it("usa snapshot 0 si falta last_unit_cost", () => {
        const sale: Sale = {
            id: "s2",
            date: "2026-08-23T10:00:00.000Z",
            amount: 50,
            currency: "USD",
            verified: BuyState.VERIFIED,
            products: [{ productId: "p9", quantity: 2, price: 25 }],
            userId: "u1",
        }
        const e = buildFinanceEventFromSale({
            sale,
            userId: "staff1",
            lastUnitCostByProductId: {},
        })
        expect(e.cogs).toBe(0)
        expect(e.lines[0]?.unitCostSnapshot).toBe(0)
        expect(e.lines[0]?.lineCogs).toBe(0)
        expect(e.margin).toBe(50)
    })
})
