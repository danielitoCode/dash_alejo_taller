import { describe, it, expect, vi } from "vitest"
import {
    assertBackofficeCannotCreateB2cSale,
    assertBackofficeCannotSoftHold,
    assertNotTerminalBuyStateWithoutStockPath,
    BackofficeCannotCreateB2cSaleError,
    BackofficeCannotSoftHoldError,
    BackofficeMustUseConfirmRejectError,
} from "../../../../../core/feature/sale/domain/policy/BackofficeSalePolicy"
import { UpdateSaleVerifiedCaseUse } from "../../../../../core/feature/sale/domain/caseuse/UpdateSaleVerifiedCaseUse"
import { CreateSaleFromPanelCaseUse } from "../../../../../core/feature/sale/domain/caseuse/CreateSaleFromPanelCaseUse"
import { BuyState } from "../../../../../core/feature/sale/domain/entity/enums"
import type { Sale } from "../../../../../core/feature/sale/domain/entity/Sale"
import type { SaleRepository } from "../../../../../core/feature/sale/domain/repository/SaleRepository"
import { productToCatalogWriteDTO } from "../../../../../core/feature/product/data/mapper/Mappers"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"

describe("Core1 6.1 — coherencia / no segundo hold", () => {
    it("assertBackofficeCannotCreateB2cSale siempre lanza", () => {
        expect(() => assertBackofficeCannotCreateB2cSale()).toThrow(
            BackofficeCannotCreateB2cSaleError
        )
    })

    it("assertBackofficeCannotSoftHold siempre lanza", () => {
        expect(() => assertBackofficeCannotSoftHold()).toThrow(BackofficeCannotSoftHoldError)
    })

    it("assertNotTerminalBuyStateWithoutStockPath bloquea VERIFIED/DELETED", () => {
        expect(() => assertNotTerminalBuyStateWithoutStockPath("VERIFIED")).toThrow(
            BackofficeMustUseConfirmRejectError
        )
        expect(() => assertNotTerminalBuyStateWithoutStockPath("DELETED")).toThrow(
            BackofficeMustUseConfirmRejectError
        )
        expect(() => assertNotTerminalBuyStateWithoutStockPath("UNVERIFIED")).not.toThrow()
    })

    it("UpdateSaleVerified bloquea VERIFIED y DELETED", async () => {
        const updateVerified = vi.fn()
        const repo: SaleRepository = {
            getAllSales: async () => [],
            create: async () => {
                throw new Error("no")
            },
            getByUser: async () => [],
            updateVerified,
        }
        const uc = new UpdateSaleVerifiedCaseUse(repo)

        await expect(uc.execute("s1", BuyState.VERIFIED)).rejects.toThrow(
            BackofficeMustUseConfirmRejectError
        )
        await expect(uc.execute("s1", BuyState.DELETED)).rejects.toThrow(
            BackofficeMustUseConfirmRejectError
        )
        expect(updateVerified).not.toHaveBeenCalled()
    })

    it("CreateSaleFromPanelCaseUse siempre rechaza", async () => {
        const uc = new CreateSaleFromPanelCaseUse()
        const dummy = {
            id: "x",
            date: "",
            amount: 0,
            products: [],
            userId: "",
            verified: BuyState.UNVERIFIED,
        } as Sale
        await expect(uc.execute(dummy)).rejects.toThrow(BackofficeCannotCreateB2cSaleError)
    })

    it("productToCatalogWriteDTO no incluye reserved (no pisa soft-hold)", () => {
        const product: Product = {
            id: "p1",
            name: "X",
            description: "",
            existence: 10,
            reserved: 3,
            price: 1,
            photoUrl: "",
            categoryId: "c1",
            status: "active",
        }
        const dto = productToCatalogWriteDTO(product)
        expect(dto).not.toHaveProperty("reserved")
        expect(dto.existence).toBe(10)
    })
})
