import { describe, expect, it } from "vitest"
import { filterPurchaseEntries } from "../../../../../core/feature/purchase/domain/util/filterPurchaseEntries"
import type { PurchaseEntry } from "../../../../../core/feature/purchase/domain/entity/PurchaseEntry"

function entry(partial: Partial<PurchaseEntry> & { id: string }): PurchaseEntry {
    return {
        entryDateIso: "2026-08-20T12:00:00.000Z",
        totalCost: 100,
        currency: "CUP",
        userId: "u1",
        lineCount: 1,
        ...partial,
    }
}

describe("filterPurchaseEntries (Core3 B2)", () => {
    const sample: PurchaseEntry[] = [
        entry({
            id: "e1",
            supplierId: "sup-a",
            reference: "F-001",
            userId: "staff-1",
            entryDateIso: "2026-08-10T10:00:00.000Z",
        }),
        entry({
            id: "e2",
            supplierId: "sup-b",
            reference: "F-002",
            userId: "staff-2",
            entryDateIso: "2026-08-20T10:00:00.000Z",
            notes: "urgencia",
        }),
        entry({
            id: "e3",
            userId: "staff-1",
            entryDateIso: "2026-08-25T10:00:00.000Z",
        }),
    ]

    it("filters by supplierId", () => {
        const out = filterPurchaseEntries(sample, { supplierId: "sup-a" })
        expect(out.map((e) => e.id)).toEqual(["e1"])
    })

    it("filters by userId", () => {
        const out = filterPurchaseEntries(sample, { userId: "staff-1" })
        expect(out.map((e) => e.id).sort()).toEqual(["e1", "e3"])
    })

    it("filters by date range (YYYY-MM-DD on entryDateIso)", () => {
        const out = filterPurchaseEntries(sample, {
            dateFrom: "2026-08-15",
            dateTo: "2026-08-22",
        })
        expect(out.map((e) => e.id)).toEqual(["e2"])
    })

    it("filters by free text query", () => {
        const out = filterPurchaseEntries(sample, { query: "urgencia" })
        expect(out.map((e) => e.id)).toEqual(["e2"])
        expect(filterPurchaseEntries(sample, { query: "F-001" }).map((e) => e.id)).toEqual([
            "e1",
        ])
    })
})
