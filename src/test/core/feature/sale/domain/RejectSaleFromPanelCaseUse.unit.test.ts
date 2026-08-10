import { describe, it, expect, vi } from "vitest"
import { RejectSaleFromPanelCaseUse } from "../../../../../core/feature/sale/domain/caseuse/RejectSaleFromPanelCaseUse"
import { BuyState } from "../../../../../core/feature/sale/domain/entity/enums"
import type { Sale } from "../../../../../core/feature/sale/domain/entity/Sale"
import type { SaleRepository } from "../../../../../core/feature/sale/domain/repository/SaleRepository"

function sale(partial: Partial<Sale> & Pick<Sale, "id" | "verified">): Sale {
    return {
        date: "2026-08-01",
        amount: 10,
        products: [{ productId: "p1", quantity: 2, price: 5 }],
        userId: "u1",
        ...partial,
    }
}

describe("RejectSaleFromPanelCaseUse (Core1 5.2)", () => {
    it("libera reserved (confirmed=false) y marca DELETED", async () => {
        const s = sale({ id: "s1", verified: BuyState.UNVERIFIED })
        const applyStockDeltas = vi.fn().mockResolvedValue({ existence: 10, reserved: 1 })
        const updateVerified = vi.fn().mockResolvedValue({ ...s, verified: BuyState.DELETED })

        const repo: SaleRepository = {
            getAllSales: async () => [s],
            create: async () => {
                throw new Error("no")
            },
            getByUser: async () => [],
            updateVerified,
        }

        const uc = new RejectSaleFromPanelCaseUse(repo, { applyStockDeltas })
        const out = await uc.execute("s1", s)

        expect(applyStockDeltas).toHaveBeenCalledWith("p1", { confirmed: false, qty: 2 })
        expect(updateVerified).toHaveBeenCalledWith("s1", BuyState.DELETED)
        expect(out.verified).toBe(BuyState.DELETED)
    })

    it("idempotente si ya DELETED: no toca stock", async () => {
        const s = sale({ id: "s1", verified: BuyState.DELETED })
        const applyStockDeltas = vi.fn()
        const updateVerified = vi.fn()

        const repo: SaleRepository = {
            getAllSales: async () => [s],
            create: async () => {
                throw new Error("no")
            },
            getByUser: async () => [],
            updateVerified,
        }

        const uc = new RejectSaleFromPanelCaseUse(repo, { applyStockDeltas })
        await uc.execute("s1", s)

        expect(applyStockDeltas).not.toHaveBeenCalled()
        expect(updateVerified).not.toHaveBeenCalled()
    })

    it("no rechaza VERIFIED", async () => {
        const s = sale({ id: "s1", verified: BuyState.VERIFIED })
        const uc = new RejectSaleFromPanelCaseUse(
            {
                getAllSales: async () => [s],
                create: async () => {
                    throw new Error("no")
                },
                getByUser: async () => [],
                updateVerified: async () => s,
            },
            { applyStockDeltas: async () => ({ existence: 0, reserved: 0 }) }
        )

        await expect(uc.execute("s1", s)).rejects.toThrow(/VERIFIED/)
    })
})
