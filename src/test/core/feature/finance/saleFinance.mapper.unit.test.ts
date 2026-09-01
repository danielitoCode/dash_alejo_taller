import { describe, expect, it } from "vitest"
import {
    saleFinanceEventFromDTO,
    saleFinanceEventToDTO,
} from "../../../../core/feature/finance/data/mapper/Mappers"
import type { SaleFinanceEventDTO } from "../../../../core/feature/finance/data/dto/SaleFinanceEventDTO"
import { createSaleFinanceEvent, createSaleFinanceLine } from "../../../../core/feature/finance/domain/entity/SaleFinanceEvent"

describe("saleFinanceEvent mapper round-trip", () => {
    it("preserves revenue cogs margin (legacy sin lines)", () => {
        const dto = {
            $id: "f1",
            $collectionId: "sale_finance_event",
            $databaseId: "db",
            $createdAt: "2026-08-18T12:00:00.000Z",
            $updatedAt: "2026-08-18T12:00:00.000Z",
            $permissions: [],
            sale_id: "sale1",
            revenue: 150,
            cogs: 40,
            margin: 110,
            user_id: "op1",
            at: "2026-08-18T12:00:00.000Z",
            currency: "CUP",
        } as unknown as SaleFinanceEventDTO
        const domain = saleFinanceEventFromDTO(dto)
        expect(domain.saleId).toBe("sale1")
        expect(domain.revenue).toBe(150)
        expect(domain.cogs).toBe(40)
        expect(domain.margin).toBe(110)
        expect(domain.lines).toEqual([])
        const write = saleFinanceEventToDTO(domain)
        expect(write.sale_id).toBe("sale1")
        expect(write.revenue).toBe(150)
        expect(write.cogs).toBe(40)
        expect(write.margin).toBe(110)
        expect(write.currency).toBe("CUP")
        expect(write.lines_json).toBeUndefined()
    })

    it("round-trip lines_json con unitCostSnapshot", () => {
        const domain = createSaleFinanceEvent({
            id: "f2",
            saleId: "sale2",
            revenue: 100,
            cogs: 25,
            margin: 75,
            userId: "staff1",
            atIso: "2026-09-01T12:00:00.000Z",
            currency: "USD",
            lines: [
                createSaleFinanceLine({
                    productId: "p1",
                    quantity: 2,
                    unitPrice: 30,
                    unitCostSnapshot: 10,
                }),
                createSaleFinanceLine({
                    productId: "p2",
                    quantity: 1,
                    unitPrice: 40,
                    unitCostSnapshot: 5,
                }),
            ],
        })
        const write = saleFinanceEventToDTO(domain)
        expect(write.lines_json).toBeTruthy()
        const dto = {
            $id: write.$id,
            $collectionId: "sale_finance_event",
            $databaseId: "db",
            $createdAt: "2026-09-01T12:00:00.000Z",
            $updatedAt: "2026-09-01T12:00:00.000Z",
            $permissions: [],
            sale_id: write.sale_id,
            revenue: write.revenue,
            cogs: write.cogs,
            margin: write.margin,
            user_id: write.user_id,
            at: write.at,
            currency: write.currency,
            lines_json: write.lines_json,
        } as unknown as SaleFinanceEventDTO
        const back = saleFinanceEventFromDTO(dto)
        expect(back.lines).toHaveLength(2)
        expect(back.lines[0]?.unitCostSnapshot).toBe(10)
        expect(back.lines[1]?.lineCogs).toBe(5)
        expect(back.lines[0]?.lineMargin).toBe(40)
    })
})
