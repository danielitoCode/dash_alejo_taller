/**
 * Moved to ../supplier.mapper.unit.test.ts (import path parity with purchase.mapper.unit.test.ts).
 * Kept as empty suite so any cached CI path does not fail on missing file mid-deploy.
 */
import { describe, it } from "vitest"

describe("supplier.mapper.test (deprecated path)", () => {
    it("delegates to supplier.mapper.unit.test.ts", () => {
        // no-op: real assertions live in src/test/core/feature/purchase/supplier.mapper.unit.test.ts
    })
})
