import { describe, it, expect } from "vitest"
import {
    formatSaleAge,
    saleAgeHours,
    saleAgeUrgency,
    saleCreatedAtMs,
    sortSalesForQueue,
} from "../../../../../core/feature/sale/domain/util/sortSalesByAge"
import { BuyState } from "../../../../../core/feature/sale/domain/entity/enums"
import type { Sale } from "../../../../../core/feature/sale/domain/entity/Sale"

function sale(
    id: string,
    verified: BuyState,
    date: string,
    createdAtIso?: string
): Sale {
    return {
        id,
        date,
        amount: 10,
        verified,
        products: [],
        userId: "u1",
        createdAtIso,
    }
}

describe("sortSalesByAge (Core2 B4.1)", () => {
    const older = sale("old", BuyState.UNVERIFIED, "2026-08-20T10:00:00.000Z", "2026-08-20T10:00:00.000Z")
    const newer = sale("new", BuyState.UNVERIFIED, "2026-08-22T10:00:00.000Z", "2026-08-22T10:00:00.000Z")
    const mid = sale("mid", BuyState.UNVERIFIED, "2026-08-21T10:00:00.000Z", "2026-08-21T10:00:00.000Z")

    it("UNVERIFIED ordena más antiguas primero", () => {
        const sorted = sortSalesForQueue([newer, older, mid], BuyState.UNVERIFIED)
        expect(sorted.map((s) => s.id)).toEqual(["old", "mid", "new"])
    })

    it("VERIFIED ordena más recientes primero", () => {
        const a = sale("a", BuyState.VERIFIED, "2026-08-20T10:00:00.000Z")
        const b = sale("b", BuyState.VERIFIED, "2026-08-22T10:00:00.000Z")
        const sorted = sortSalesForQueue([a, b], BuyState.VERIFIED)
        expect(sorted.map((s) => s.id)).toEqual(["b", "a"])
    })

    it("saleCreatedAtMs prefiere createdAtIso", () => {
        const s = sale("x", BuyState.UNVERIFIED, "2020-01-01", "2026-08-23T12:00:00.000Z")
        expect(saleCreatedAtMs(s)).toBe(Date.parse("2026-08-23T12:00:00.000Z"))
    })

    it("saleAgeUrgency umbrales", () => {
        expect(saleAgeUrgency(1)).toBe("fresh")
        expect(saleAgeUrgency(12)).toBe("warn")
        expect(saleAgeUrgency(48)).toBe("critical")
    })

    it("formatSaleAge", () => {
        const now = Date.parse("2026-08-23T12:00:00.000Z")
        const s = sale("x", BuyState.UNVERIFIED, "2026-08-23T10:00:00.000Z", "2026-08-23T10:00:00.000Z")
        expect(formatSaleAge(s, now)).toBe("hace 2 h")
        expect(saleAgeHours(s, now)).toBeCloseTo(2, 5)
    })
})
