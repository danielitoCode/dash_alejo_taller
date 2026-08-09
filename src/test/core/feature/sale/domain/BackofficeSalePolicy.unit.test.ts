import { describe, it, expect } from "vitest"
import {
    assertBackofficeCannotCreateB2cSale,
    BackofficeCannotCreateB2cSaleError,
    BACKOFFICE_NO_B2C_CREATE_MESSAGE,
    isBackofficeCannotCreateB2cSaleError,
} from "../../../../../core/feature/sale/domain/policy/BackofficeSalePolicy"

describe("BackofficeSalePolicy (Core1 4.4)", () => {
    it("assert siempre lanza y no permite alta B2C", () => {
        expect(() => assertBackofficeCannotCreateB2cSale()).toThrow(
            BackofficeCannotCreateB2cSaleError
        )
        expect(() => assertBackofficeCannotCreateB2cSale()).toThrow(
            /Core1 4.4/
        )
    })

    it("mensaje de política estable", () => {
        expect(BACKOFFICE_NO_B2C_CREATE_MESSAGE).toMatch(/tienda/i)
        expect(BACKOFFICE_NO_B2C_CREATE_MESSAGE).toMatch(/soft-hold/i)
    })

    it("isBackofficeCannotCreateB2cSaleError", () => {
        try {
            assertBackofficeCannotCreateB2cSale()
        } catch (e) {
            expect(isBackofficeCannotCreateB2cSaleError(e)).toBe(true)
        }
        expect(isBackofficeCannotCreateB2cSaleError(new Error("otro"))).toBe(false)
    })
})
