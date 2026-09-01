import { describe, it, expect } from "vitest"
import {
    aggregateFinanceSummary,
    emptyFinanceSummary,
    financeRangeLastDays,
} from "../../../../core/feature/finance/domain/util/aggregateFinanceSummary"
import type { SaleFinanceEvent } from "../../../../core/feature/finance/domain/entity/SaleFinanceEvent"

function ev(
    partial: Partial<SaleFinanceEvent> & Pick<SaleFinanceEvent, "id" | "saleId">
): SaleFinanceEvent {
    return {
        id: partial.id,
        saleId: partial.saleId,
        revenue: partial.revenue ?? 0,
        cogs: partial.cogs ?? 0,
        margin: partial.margin ?? 0,
        userId: partial.userId ?? "u1",
        atIso: partial.atIso ?? "2026-08-20T12:00:00.000Z",
        currency: partial.currency ?? "CUP",
        /** Core 4: lines obligatorio; vacío en fixtures de agregado (solo totales). */
        lines: partial.lines ?? [],
    }
}

describe("aggregateFinanceSummary (Core2 B4.2 / Core4)", () => {
    it("vacío", () => {
        expect(aggregateFinanceSummary([])).toEqual(emptyFinanceSummary())
    })

    it("suma revenue/cogs/margin y agrupa por moneda", () => {
        const events = [
            ev({ id: "1", saleId: "s1", revenue: 100, cogs: 40, margin: 60, currency: "CUP" }),
            ev({ id: "2", saleId: "s2", revenue: 50, cogs: 20, margin: 30, currency: "CUP" }),
            ev({ id: "3", saleId: "s3", revenue: 10, cogs: 4, margin: 6, currency: "USD" }),
        ]
        const s = aggregateFinanceSummary(events)
        expect(s.count).toBe(3)
        expect(s.revenue).toBe(160)
        expect(s.cogs).toBe(64)
        expect(s.margin).toBe(96)
        expect(s.byCurrency).toHaveLength(2)
        const cup = s.byCurrency.find((b) => b.currency === "CUP")
        expect(cup).toEqual({
            currency: "CUP",
            revenue: 150,
            cogs: 60,
            margin: 90,
            count: 2,
        })
    })

    it("financeRangeLastDays produce ISO válidos", () => {
        const now = Date.parse("2026-08-23T12:00:00.000Z")
        const { fromIso, toIso } = financeRangeLastDays(30, now)
        expect(Date.parse(toIso)).toBe(now)
        expect(Date.parse(fromIso)).toBe(now - 30 * 24 * 60 * 60 * 1000)
    })
})
