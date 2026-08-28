import { describe, expect, it } from "vitest"
import {
    createCupExchange,
    cupToUsd,
    decidePriceProtection,
    needsPriceProtection,
    protectedSalePrice,
    PRICE_PROTECTION_MARKUP,
} from "../../../../../core/feature/exchange/domain/entity/CupExchange"

describe("CupExchange / cupToUsd", () => {
    it("creates valid exchange", () => {
        const e = createCupExchange({
            id: "d-1",
            usdReference: 350,
            updatedAt: "2026-08-28T12:00:00Z",
            source: "DIRECTORIO_CUBANO",
        })
        expect(e.usdReference).toBe(350)
        expect(e.source).toBe("DIRECTORIO_CUBANO")
    })

    it("rejects non-positive rate", () => {
        expect(() =>
            createCupExchange({
                id: "x",
                usdReference: 0,
                updatedAt: "2026-08-28",
                source: "DIRECTORIO_CUBANO",
            })
        ).toThrow()
    })

    it("cupToUsd divides by CUP-per-USD", () => {
        expect(cupToUsd(700, 350)).toBe(2)
        expect(cupToUsd(350, 350)).toBe(1)
        expect(cupToUsd(0, 350)).toBe(0)
    })

    it("cupToUsd rejects invalid rate", () => {
        expect(() => cupToUsd(100, 0)).toThrow()
        expect(() => cupToUsd(-1, 350)).toThrow()
    })
})

describe("price protection (EXCHANGE_POLICY §5)", () => {
    it("needsPriceProtection only when cost > price", () => {
        expect(needsPriceProtection(12, 10)).toBe(true)
        expect(needsPriceProtection(10, 10)).toBe(false)
        expect(needsPriceProtection(9, 10)).toBe(false)
        expect(needsPriceProtection(0, 10)).toBe(false)
        expect(needsPriceProtection(5, 0)).toBe(true)
    })

    it("protectedSalePrice applies 1.30 markup", () => {
        expect(PRICE_PROTECTION_MARKUP).toBe(1.3)
        expect(protectedSalePrice(10)).toBe(13)
        expect(protectedSalePrice(2)).toBeCloseTo(2.6)
    })

    it("decidePriceProtection returns applied decision", () => {
        const d = decidePriceProtection(20, 15)
        expect(d.applied).toBe(true)
        expect(d.previousPrice).toBe(15)
        expect(d.newPrice).toBe(26)
        expect(d.unitCostUsd).toBe(20)
    })

    it("decidePriceProtection does not lower price", () => {
        const d = decidePriceProtection(5, 20)
        expect(d.applied).toBe(false)
        expect(d.newPrice).toBe(20)
    })
})
