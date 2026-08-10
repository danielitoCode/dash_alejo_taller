import { describe, it, expect, vi } from "vitest"
import { ConfirmSaleFromPanelCaseUse } from "../../../../../core/feature/sale/domain/caseuse/ConfirmSaleFromPanelCaseUse"
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

describe("ConfirmSaleFromPanelCaseUse (Core1 5.1)", () => {
    it("aplica stock y marca VERIFIED desde UNVERIFIED", async () => {
        const s = sale({ id: "s1", verified: BuyState.UNVERIFIED })
        const applyStockDeltas = vi.fn().mockResolvedValue({ existence: 8, reserved: 0 })
        const updateVerified = vi.fn().mockResolvedValue({ ...s, verified: BuyState.VERIFIED })

        const repo: SaleRepository = {
            getAllSales: async () => [s],
            create: async () => {
                throw new Error("no")
            },
            getByUser: async () => [],
            updateVerified,
        }

        const uc = new ConfirmSaleFromPanelCaseUse(repo, { applyStockDeltas })
        const out = await uc.execute("s1", s)

        expect(applyStockDeltas).toHaveBeenCalledWith("p1", { confirmed: true, qty: 2 })
        expect(updateVerified).toHaveBeenCalledWith("s1", BuyState.VERIFIED)
        expect(out.verified).toBe(BuyState.VERIFIED)
    })

    it("idempotente si ya VERIFIED: no toca stock", async () => {
        const s = sale({ id: "s1", verified: BuyState.VERIFIED })
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

        const uc = new ConfirmSaleFromPanelCaseUse(repo, { applyStockDeltas })
        await uc.execute("s1", s)

        expect(applyStockDeltas).not.toHaveBeenCalled()
        expect(updateVerified).not.toHaveBeenCalled()
    })

    it("rechaza confirmar DELETED", async () => {
        const s = sale({ id: "s1", verified: BuyState.DELETED })
        const uc = new ConfirmSaleFromPanelCaseUse(
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

        await expect(uc.execute("s1", s)).rejects.toThrow(/DELETED/)
    })
})
