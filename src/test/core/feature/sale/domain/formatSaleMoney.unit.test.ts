import { describe, it, expect } from "vitest"
import {
    formatSaleMoney,
    saleCurrencyCode,
} from "../../../../../core/feature/sale/domain/util/formatSaleMoney"

describe("formatSaleMoney (Core1 4.3)", () => {
    it("sin currency no antepone $", () => {
        const s = formatSaleMoney(12.5, null)
        expect(s).toBe("12.50")
        expect(s.startsWith("$")).toBe(false)
    })

    it("con CUP incluye código o formato local", () => {
        const s = formatSaleMoney(100, "cup")
        expect(s.toUpperCase()).toMatch(/CUP|100/)
    })

    it("con USD no falla", () => {
        const s = formatSaleMoney(9.99, "USD")
        expect(s).toMatch(/9\.99/)
    })

    it("saleCurrencyCode normaliza", () => {
        expect(saleCurrencyCode(" cup ")).toBe("CUP")
        expect(saleCurrencyCode("")).toBeNull()
        expect(saleCurrencyCode(null)).toBeNull()
    })
})
