import { describe, expect, it } from "vitest"
import { CancelPurchaseEntryCaseUse } from "../../../../../core/feature/purchase/domain/caseuse/CancelPurchaseEntryCaseUse"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"
import type { PurchaseEntry, PurchaseEntryLine } from "../../../../../core/feature/purchase/domain/entity/PurchaseEntry"
import type { PurchaseEntryRepository } from "../../../../../core/feature/purchase/domain/repository/purchase.repository"
import type { PaginatedResult, ProductRepository } from "../../../../../core/feature/product/domain/repository/product.repository"
import type { StockMovement } from "../../../../../core/feature/inventory/domain/entity/StockMovement"
import type { StockMovementRepository } from "../../../../../core/feature/inventory/domain/repository/stock-movement.repository"
import type { TransactionRunner } from "../../../../../core/feature/purchase/domain/repository/transaction.repository"

function product(partial: Partial<Product> & { id: string }): Product {
    return {
        name: "P",
        description: "",
        price: 10,
        existence: 0,
        reserved: 0,
        photoUrl: "",
        categoryId: "c1",
        status: "active",
        ...partial,
    }
}

class FakeProductRepo implements ProductRepository {
    store = new Map<string, Product>()
    constructor(initial: Product[]) {
        initial.forEach((p) => this.store.set(p.id, p))
    }
    async getAll(_l: number, _o: number): Promise<PaginatedResult<Product>> {
        const items = [...this.store.values()]
        return { items, total: items.length }
    }
    async getById(id: string) { return this.store.get(id) ?? null }
    async getByCategory(id: string) { return [...this.store.values()].filter((p) => p.categoryId === id) }
    async create(p: Product) { this.store.set(p.id, p); return p }
    async update(id: string, patch: Partial<Product>) {
        const current = this.store.get(id)
        if (!current) throw new Error("missing product")
        const next = { ...current, ...patch }
        this.store.set(id, next)
        return next
    }
    async delete(id: string) { this.store.delete(id) }
}

class FakePurchaseRepo implements PurchaseEntryRepository {
    entry: PurchaseEntry
    lines: PurchaseEntryLine[]
    constructor(entry: PurchaseEntry, lines: PurchaseEntryLine[]) {
        this.entry = entry
        this.lines = lines
    }
    async createEntry(e: PurchaseEntry) { this.entry = e; return e }
    async createLine(l: PurchaseEntryLine) { this.lines.push(l); return l }
    async getEntryById(id: string) { return id === this.entry.id ? this.entry : null }
    async updateEntry(_id: string, patch: Partial<PurchaseEntry>) {
        this.entry = { ...this.entry, ...patch }
        return this.entry
    }
    async listEntries() { return [this.entry] }
    async listLinesByEntry(id: string) { return this.lines.filter((l) => l.entryId === id) }
    async listLinesByProduct(id: string) { return this.lines.filter((l) => l.productId === id) }
}

class FakeMovementRepo implements StockMovementRepository {
    created: StockMovement[] = []
    async create(m: StockMovement) { this.created.push(m); return m }
    async listByProduct() { return [] }
    async listRecent() { return [] }
    async listByEntry(id: string) { return this.created.filter((m) => m.entryId === id) }
}

const runner: TransactionRunner = {
    async run(work) {
        return work("tx-test")
    },
}

function setup(reserved = 1) {
    const entry: PurchaseEntry = {
        id: "e1",
        entryDateIso: new Date().toISOString(),
        totalCost: 100,
        currency: "USD",
        userId: "staff",
        lineCount: 1,
        status: "ACTIVE",
    }
    const line: PurchaseEntryLine = {
        id: "l1",
        entryId: "e1",
        productId: "p1",
        quantity: 3,
        unitCost: 20,
        concept: "purchase",
        lineCost: 60,
    }
    const products = new FakeProductRepo([
        product({ id: "p1", existence: 10, reserved, lastUnitCost: 20 }),
    ])
    const purchase = new FakePurchaseRepo(entry, [line])
    const movements = new FakeMovementRepo()
    const uc = new CancelPurchaseEntryCaseUse(
        purchase,
        products,
        movements,
        runner,
        async () => "staff-9"
    )
    return { uc, products, purchase, movements }
}

describe("CancelPurchaseEntryCaseUse B3.1", () => {
    it("reverses existence, preserves reserved/lastUnitCost and creates compensating movement", async () => {
        const { uc, products, purchase, movements } = setup()
        const result = await uc.execute("e1")

        expect(result).toEqual({ entryId: "e1", reversedLines: 1 })
        expect(products.store.get("p1")!.existence).toBe(7)
        expect(products.store.get("p1")!.reserved).toBe(1)
        expect(products.store.get("p1")!.lastUnitCost).toBe(20)
        expect(movements.created).toHaveLength(1)
        expect(movements.created[0].type).toBe("ajuste")
        expect(movements.created[0].reason).toBe("purchase_entry_reversal")
        expect(movements.created[0].quantity).toBe(3)
        expect(movements.created[0].balanceAfter).toBe(7)
        expect(movements.created[0].entryId).toBe("e1")
        expect(purchase.entry.status).toBe("CANCELLED")
    })

    it("rejects reversal when it would violate existence >= reserved", async () => {
        const { uc, products, purchase, movements } = setup(8)
        await expect(uc.execute("e1")).rejects.toThrow(/reserved/)
        expect(products.store.get("p1")!.existence).toBe(10)
        expect(movements.created).toHaveLength(0)
        expect(purchase.entry.status).toBe("ACTIVE")
    })

    it("is idempotent at the domain boundary", async () => {
        const { uc, movements } = setup()
        await uc.execute("e1")
        await expect(uc.execute("e1")).rejects.toThrow(/already cancelled/)
        expect(movements.created).toHaveLength(1)
    })
})
