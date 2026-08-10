import { describe, it, expect } from "vitest"
import {
    nextStockAfterConfirm,
    nextStockAfterReject,
    clampNonNegative,
} from "../../../../../core/feature/sale/domain/policy/StockDecisionMath"

describe("StockDecisionMath (Core1 5.1 paridad operador)", () => {
    it("confirm: existence -= qty y reserved -= qty", () => {
        expect(nextStockAfterConfirm(10, 3, 2)).toEqual({ existence: 8, reserved: 1 })
    })

    it("confirm: no baja de 0 (clamp)", () => {
        expect(nextStockAfterConfirm(1, 5, 3)).toEqual({ existence: 0, reserved: 2 })
        expect(nextStockAfterConfirm(0, 0, 1)).toEqual({ existence: 0, reserved: 0 })
    })

    it("reject: solo reserved -= qty", () => {
        expect(nextStockAfterReject(10, 4, 2)).toEqual({ existence: 10, reserved: 2 })
    })

    it("qty 0 no cambia", () => {
        expect(nextStockAfterConfirm(5, 2, 0)).toEqual({ existence: 5, reserved: 2 })
    })

    it("clampNonNegative", () => {
        expect(clampNonNegative(-3)).toBe(0)
        expect(clampNonNegative(2.9)).toBe(2)
    })
})
