import { describe, it, expect } from "vitest"
import {
    countSalesByStatus,
    filterSalesByStatus,
    saleStateLabel,
} from "../../../../../core/feature/sale/domain/util/filterSalesByStatus"
import { BuyState } from "../../../../../core/feature/sale/domain/entity/enums"
import type { Sale } from "../../../../../core/feature/sale/domain/entity/Sale"

function sale(id: string, verified: BuyState): Sale {
    return {
        id,
        date: "2026-01-01",
        amount: 10,
        verified,
        products: [],
        userId: "u1",
    }
}

describe("filterSalesByStatus (Core1 4.1)", () => {
    const sample = [
        sale("a", BuyState.UNVERIFIED),
        sale("b", BuyState.VERIFIED),
        sale("c", BuyState.DELETED),
        sale("d", BuyState.UNVERIFIED),
    ]

    it("all devuelve todas", () => {
        expect(filterSalesByStatus(sample, "all")).toHaveLength(4)
    })

    it("filtra UNVERIFIED (cola pendientes)", () => {
        const pending = filterSalesByStatus(sample, BuyState.UNVERIFIED)
        expect(pending.map((s) => s.id)).toEqual(["a", "d"])
    })

    it("filtra VERIFIED", () => {
        expect(filterSalesByStatus(sample, BuyState.VERIFIED).map((s) => s.id)).toEqual(["b"])
    })

    it("filtra DELETED", () => {
        expect(filterSalesByStatus(sample, BuyState.DELETED).map((s) => s.id)).toEqual(["c"])
    })

    it("countSalesByStatus", () => {
        expect(countSalesByStatus(sample)).toEqual({
            total: 4,
            pending: 2,
            verified: 1,
            rejected: 1,
        })
    })

    it("saleStateLabel", () => {
        expect(saleStateLabel(BuyState.UNVERIFIED)).toBe("Pendiente")
        expect(saleStateLabel(BuyState.VERIFIED)).toBe("Confirmado")
        expect(saleStateLabel(BuyState.DELETED)).toBe("Rechazado")
    })
})
