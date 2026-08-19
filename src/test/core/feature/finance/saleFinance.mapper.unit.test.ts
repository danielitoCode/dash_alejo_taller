import { describe, expect, it } from "vitest"
import {
    saleFinanceEventFromDTO,
    saleFinanceEventToDTO,
} from "../../../../core/feature/finance/data/mapper/Mappers"
import type { SaleFinanceEventDTO } from "../../../../core/feature/finance/data/dto/SaleFinanceEventDTO"

describe("saleFinanceEvent mapper round-trip", () => {
    it("preserves revenue cogs margin", () => {
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
        const write = saleFinanceEventToDTO(domain)
        expect(write.sale_id).toBe("sale1")
        expect(write.revenue).toBe(150)
        expect(write.cogs).toBe(40)
        expect(write.margin).toBe(110)
        expect(write.currency).toBe("CUP")
    })
})
