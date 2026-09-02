import { describe, it, expect, vi } from "vitest"
import { RegisterSaleFinanceFromVerifiedCaseUse } from "../../../../core/feature/finance/domain/caseuse/RegisterSaleFinanceFromVerifiedCaseUse"
import type { SaleFinanceRepository } from "../../../../core/feature/finance/domain/repository/sale-finance.repository"
import type { SaleFinanceEvent } from "../../../../core/feature/finance/domain/entity/SaleFinanceEvent"
import { BuyState } from "../../../../core/feature/sale/domain/entity/enums"
import type { Sale } from "../../../../core/feature/sale/domain/entity/Sale"

vi.mock("../../../../core/infrastructure/presentation/util/logger.service", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() },
}))

function saleFixture(partial?: Partial<Sale>): Sale {
    return {
        id: "sale-b4-1",
        date: "2026-09-01T12:00:00.000Z",
        amount: 100,
        currency: "USD",
        verified: BuyState.VERIFIED,
        products: [
            { productId: "p1", quantity: 2, price: 30 },
            { productId: "p2", quantity: 1, price: 40 },
        ],
        userId: "customer-1",
        ...partial,
    }
}

function fakeRepo(seed?: SaleFinanceEvent | null): SaleFinanceRepository & {
    store: Map<string, SaleFinanceEvent>
    createCalls: number
} {
    const store = new Map<string, SaleFinanceEvent>()
    if (seed) store.set(seed.saleId, seed)
    let createCalls = 0
    return {
        store,
        get createCalls() {
            return createCalls
        },
        async create(event) {
            createCalls++
            store.set(event.saleId, event)
            return event
        },
        async getBySaleId(saleId) {
            return store.get(saleId) ?? null
        },
        async listByDateRange() {
            return [...store.values()]
        },
    }
}

describe("RegisterSaleFinanceFromVerifiedCaseUse (Core4 B4)", () => {
    it("crea event con lines/snapshot en el primer execute", async () => {
        const repo = fakeRepo()
        const uc = new RegisterSaleFinanceFromVerifiedCaseUse(repo, async () => "staff-1")
        const sale = saleFixture()

        const created = await uc.execute(sale, (id) => (id === "p1" ? 10 : id === "p2" ? 5 : 0))

        expect(repo.createCalls).toBe(1)
        expect(created.saleId).toBe("sale-b4-1")
        expect(created.cogs).toBe(2 * 10 + 1 * 5)
        expect(created.lines).toHaveLength(2)
        expect(created.lines[0]?.unitCostSnapshot).toBe(10)
        expect(created.lines[1]?.unitCostSnapshot).toBe(5)
    })

    it("segundo execute es idempotente: no llama create ni recalcula", async () => {
        const repo = fakeRepo()
        const uc = new RegisterSaleFinanceFromVerifiedCaseUse(repo, async () => "staff-1")
        const sale = saleFixture()

        const first = await uc.execute(sale, () => 10)
        expect(repo.createCalls).toBe(1)
        expect(first.cogs).toBe(2 * 10 + 1 * 10)

        // Costos vivos distintos: no deben afectar el histórico
        const second = await uc.execute(sale, () => 999)

        expect(repo.createCalls).toBe(1)
        expect(second).toBe(first)
        expect(second.cogs).toBe(first.cogs)
        expect(second.lines[0]?.unitCostSnapshot).toBe(10)
        expect(second.lines.every((l) => l.unitCostSnapshot !== 999)).toBe(true)
    })

    it("si ya existe event en repo, no sobrescribe aunque cambie last_unit_cost", async () => {
        const frozen: SaleFinanceEvent = {
            id: "fin_sale-b4-1",
            saleId: "sale-b4-1",
            revenue: 100,
            cogs: 25,
            margin: 75,
            userId: "staff-1",
            atIso: "2026-09-01T12:00:00.000Z",
            currency: "USD",
            lines: [
                {
                    productId: "p1",
                    quantity: 2,
                    unitPrice: 30,
                    unitCostSnapshot: 10,
                    lineRevenue: 60,
                    lineCogs: 20,
                    lineMargin: 40,
                },
                {
                    productId: "p2",
                    quantity: 1,
                    unitPrice: 40,
                    unitCostSnapshot: 5,
                    lineRevenue: 40,
                    lineCogs: 5,
                    lineMargin: 35,
                },
            ],
        }
        const repo = fakeRepo(frozen)
        const uc = new RegisterSaleFinanceFromVerifiedCaseUse(repo, async () => "staff-other")

        const out = await uc.execute(saleFixture(), () => 50)

        expect(repo.createCalls).toBe(0)
        expect(out).toEqual(frozen)
        expect(out.lines[0]?.unitCostSnapshot).toBe(10)
        expect(out.cogs).toBe(25)
    })
})
