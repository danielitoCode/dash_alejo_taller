import { describe, expect, it } from "vitest"
import { createCupExchange, cupToUsd } from "../../../../../core/feature/exchange/domain/entity/CupExchange"

describe("CupExchange / cupToUsd", () => {
    it("creates valid exchange", () => {
        const e = createCupExchange({
            id: "d-1",
            usdReference: 350,
            updatedAt: "2026-08-28T12:00:00Z",
            source: "DIRECTORIO_CUBANO",
        })
        expect(e.usdReference).toBe(350)
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
    })

    it("cupToUsd rejects invalid rate", () => {
        expect(() => cupToUsd(100, 0)).toThrow()
    })
})
