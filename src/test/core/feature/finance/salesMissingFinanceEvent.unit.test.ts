import { describe, it, expect } from "vitest"
import { salesMissingFinanceEvent } from "../../../../core/feature/finance/domain/util/salesMissingFinanceEvent"

describe("salesMissingFinanceEvent (Core4 B4 reconcile)", () => {
    it("solo devuelve sale_ids sin event existente", () => {
        const missing = salesMissingFinanceEvent(
            ["s1", "s2", "s3"],
            new Set(["s2"])
        )
        expect(missing).toEqual(["s1", "s3"])
    })

    it("no incluye ids vacíos y no duplica lógica de overwrite", () => {
        const missing = salesMissingFinanceEvent(
            ["", "s1", "s1", "  "],
            new Set(["s1"])
        )
        // s1 ya tiene finance → no sale; vacíos se omiten
        expect(missing).toEqual([])
    })

    it("si no hay events existentes, todos los VERIFIED son candidatos a create", () => {
        expect(salesMissingFinanceEvent(["a", "b"], new Set())).toEqual(["a", "b"])
    })
})
