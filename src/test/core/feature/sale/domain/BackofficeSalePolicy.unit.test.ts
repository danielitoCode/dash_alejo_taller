import { describe, it, expect } from "vitest"
import {
    assertBackofficeCannotCreateB2cSale,
    BackofficeCannotCreateB2cSaleError,
    BACKOFFICE_NO_B2C_CREATE_MESSAGE,
    isBackofficeCannotCreateB2cSaleError,
} from "../../../../../core/feature/sale/domain/policy/BackofficeSalePolicy"

describe("BackofficeSalePolicy (Core1 4.4 / 6.1 — no B2C create)", () => {
    it("assert siempre lanza y no permite alta B2C", () => {
        expect(() => assertBackofficeCannotCreateB2cSale()).toThrow(
            BackofficeCannotCreateB2cSaleError
        )
        // Mensaje canónico actual (6.1); 4.4 quedó absorbido en la misma política
        expect(() => assertBackofficeCannotCreateB2cSale()).toThrow(
            /Core1 6\.1/
        )
        expect(() => assertBackofficeCannotCreateB2cSale()).toThrow(
            /no puede crear ventas B2C/i
        )
    })

    it("mensaje de política estable", () => {
        expect(BACKOFFICE_NO_B2C_CREATE_MESSAGE).toMatch(/tienda/i)
        expect(BACKOFFICE_NO_B2C_CREATE_MESSAGE).toMatch(/soft-hold/i)
        expect(BACKOFFICE_NO_B2C_CREATE_MESSAGE).toMatch(/Core1 6\.1/)
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
