import { describe, it, expect } from "vitest"
import {
    aggregateSaleOperations,
    pendingQueuePreview,
} from "../../../../core/feature/sale/domain/util/aggregateSaleOperations"
import type { Sale } from "../../../../core/feature/sale/domain/entity/Sale"
import { BuyState } from "../../../../core/feature/sale/domain/entity/enums"

const NOW = Date.parse("2026-09-02T12:00:00.000Z")

function sale(partial: Partial<Sale> & Pick<Sale, "id" | "verified">): Sale {
    return {
        id: partial.id,
        date: partial.date ?? partial.createdAtIso ?? "2026-09-01T12:00:00.000Z",
        amount: partial.amount ?? 100,
        currency: partial.currency ?? "CUP",
        verified: partial.verified,
        products: partial.products ?? [],
        userId: partial.userId ?? "u1",
        createdAtIso: partial.createdAtIso ?? partial.date ?? "2026-09-01T12:00:00.000Z",
        updatedAtIso: partial.updatedAtIso,
    }
}

describe("aggregateSaleOperations (Core5 B4)", () => {
    it("vacío → ceros", () => {
        const s = aggregateSaleOperations([], { periodDays: 30, nowMs: NOW })
        expect(s.unverifiedOpen).toBe(0)
        expect(s.aging).toEqual({ fresh: 0, warn: 0, critical: 0 })
        expect(s.verifiedInPeriod).toBe(0)
        expect(s.deletedInPeriod).toBe(0)
        expect(s.createdInPeriod).toBe(0)
        expect(s.periodDays).toBe(30)
    })

    it("cola UNVERIFIED + aging por umbrales 12h / 48h", () => {
        const sales = [
            sale({
                id: "f",
                verified: BuyState.UNVERIFIED,
                createdAtIso: new Date(NOW - 2 * 3600_000).toISOString(),
            }),
            sale({
                id: "w",
                verified: BuyState.UNVERIFIED,
                createdAtIso: new Date(NOW - 20 * 3600_000).toISOString(),
            }),
            sale({
                id: "c",
                verified: BuyState.UNVERIFIED,
                createdAtIso: new Date(NOW - 60 * 3600_000).toISOString(),
            }),
            sale({
                id: "v",
                verified: BuyState.VERIFIED,
                createdAtIso: new Date(NOW - 5 * 3600_000).toISOString(),
                updatedAtIso: new Date(NOW - 4 * 3600_000).toISOString(),
            }),
        ]
        const s = aggregateSaleOperations(sales, { periodDays: 30, nowMs: NOW })
        expect(s.unverifiedOpen).toBe(3)
        expect(s.aging.fresh).toBe(1)
        expect(s.aging.warn).toBe(1)
        expect(s.aging.critical).toBe(1)
        expect(s.verifiedInPeriod).toBe(1)
    })

    it("verified/deleted fuera de período no cuentan", () => {
        const old = new Date(NOW - 40 * 24 * 3600_000).toISOString()
        const sales = [
            sale({
                id: "old-v",
                verified: BuyState.VERIFIED,
                createdAtIso: old,
                updatedAtIso: old,
            }),
            sale({
                id: "old-d",
                verified: BuyState.DELETED,
                createdAtIso: old,
                updatedAtIso: old,
            }),
            sale({
                id: "new-d",
                verified: BuyState.DELETED,
                createdAtIso: new Date(NOW - 2 * 24 * 3600_000).toISOString(),
                updatedAtIso: new Date(NOW - 1 * 24 * 3600_000).toISOString(),
            }),
        ]
        const s = aggregateSaleOperations(sales, { periodDays: 30, nowMs: NOW })
        expect(s.verifiedInPeriod).toBe(0)
        expect(s.deletedInPeriod).toBe(1)
        expect(s.unverifiedOpen).toBe(0)
    })

    it("pendingQueuePreview ordena más antiguas primero", () => {
        const sales = [
            sale({
                id: "new",
                verified: BuyState.UNVERIFIED,
                createdAtIso: new Date(NOW - 1 * 3600_000).toISOString(),
            }),
            sale({
                id: "old",
                verified: BuyState.UNVERIFIED,
                createdAtIso: new Date(NOW - 30 * 3600_000).toISOString(),
            }),
            sale({
                id: "done",
                verified: BuyState.VERIFIED,
                createdAtIso: new Date(NOW - 50 * 3600_000).toISOString(),
            }),
        ]
        const q = pendingQueuePreview(sales, 5, NOW)
        expect(q.map((s) => s.id)).toEqual(["old", "new"])
    })
})
