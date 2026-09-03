import { describe, it, expect } from "vitest"
import { aggregateByProduct } from "../../../../core/feature/finance/domain/util/aggregateFinanceSummary"
import type {
    SaleFinanceEvent,
    SaleFinanceLine,
} from "../../../../core/feature/finance/domain/entity/SaleFinanceEvent"

function line(
    partial: Partial<SaleFinanceLine> & Pick<SaleFinanceLine, "productId">
): SaleFinanceLine {
    const quantity = partial.quantity ?? 1
    const unitPrice = partial.unitPrice ?? 10
    const unitCostSnapshot = partial.unitCostSnapshot ?? 4
    const lineRevenue = partial.lineRevenue ?? unitPrice * quantity
    const lineCogs = partial.lineCogs ?? unitCostSnapshot * quantity
    return {
        productId: partial.productId,
        quantity,
        unitPrice,
        unitCostSnapshot,
        lineRevenue,
        lineCogs,
        lineMargin: partial.lineMargin ?? lineRevenue - lineCogs,
    }
}

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
        lines: partial.lines ?? [],
    }
}

describe("aggregateByProduct (Core5 B3)", () => {
    it("lista vacía → []", () => {
        expect(aggregateByProduct([])).toEqual([])
    })

    it("eventos legacy sin lines → [] (no inventa desglose)", () => {
        const events = [
            ev({ id: "1", saleId: "s1", revenue: 100, cogs: 40, margin: 60, lines: [] }),
            ev({ id: "2", saleId: "s2", revenue: 50, cogs: 20, margin: 30 }),
        ]
        expect(aggregateByProduct(events)).toEqual([])
    })

    it("suma por productId desde lines (snapshot); orden por lineRevenue desc", () => {
        const events = [
            ev({
                id: "1",
                saleId: "s1",
                revenue: 130,
                cogs: 50,
                margin: 80,
                lines: [
                    line({
                        productId: "p-a",
                        quantity: 2,
                        unitPrice: 50,
                        unitCostSnapshot: 20,
                        lineRevenue: 100,
                        lineCogs: 40,
                        lineMargin: 60,
                    }),
                    line({
                        productId: "p-b",
                        quantity: 1,
                        unitPrice: 30,
                        unitCostSnapshot: 10,
                        lineRevenue: 30,
                        lineCogs: 10,
                        lineMargin: 20,
                    }),
                ],
            }),
            ev({
                id: "2",
                saleId: "s2",
                revenue: 50,
                cogs: 20,
                margin: 30,
                lines: [
                    line({
                        productId: "p-a",
                        quantity: 1,
                        unitPrice: 50,
                        unitCostSnapshot: 20,
                        lineRevenue: 50,
                        lineCogs: 20,
                        lineMargin: 30,
                    }),
                ],
            }),
        ]

        const rows = aggregateByProduct(events)
        expect(rows).toHaveLength(2)
        expect(rows[0]).toMatchObject({
            productId: "p-a",
            quantity: 3,
            lineRevenue: 150,
            lineCogs: 60,
            lineMargin: 90,
            saleCount: 2,
        })
        expect(rows[1]).toMatchObject({
            productId: "p-b",
            quantity: 1,
            lineRevenue: 30,
            lineCogs: 10,
            lineMargin: 20,
            saleCount: 1,
        })
    })

    it("mezcla legacy + con lines: solo cuenta lines; no usa revenue de documento para producto", () => {
        const events = [
            ev({ id: "leg", saleId: "s-leg", revenue: 999, cogs: 1, margin: 998, lines: [] }),
            ev({
                id: "c4",
                saleId: "s-c4",
                revenue: 10,
                cogs: 4,
                margin: 6,
                lines: [
                    line({
                        productId: "p1",
                        quantity: 1,
                        lineRevenue: 10,
                        lineCogs: 4,
                        lineMargin: 6,
                    }),
                ],
            }),
        ]
        const rows = aggregateByProduct(events)
        expect(rows).toHaveLength(1)
        expect(rows[0].lineRevenue).toBe(10)
        expect(rows[0].lineCogs).toBe(4)
    })

    it("ignora productId vacío y trata NaN de línea como 0", () => {
        const events = [
            ev({
                id: "1",
                saleId: "s1",
                lines: [
                    line({ productId: "  ", lineRevenue: 100, lineCogs: 1, lineMargin: 99 }),
                    {
                        productId: "p-ok",
                        quantity: 1,
                        unitPrice: 0,
                        unitCostSnapshot: 0,
                        lineRevenue: Number.NaN as unknown as number,
                        lineCogs: undefined as unknown as number,
                        lineMargin: undefined as unknown as number,
                    },
                ],
            }),
        ]
        const rows = aggregateByProduct(events)
        expect(rows).toHaveLength(1)
        expect(rows[0].productId).toBe("p-ok")
        expect(rows[0].lineRevenue).toBe(0)
        expect(rows[0].lineCogs).toBe(0)
        expect(rows[0].lineMargin).toBe(0)
    })
})
