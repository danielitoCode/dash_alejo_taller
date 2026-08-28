import { describe, expect, it } from "vitest"
import { RegisterPurchaseEntryCaseUse } from "../../../../../core/feature/purchase/domain/caseuse/RegisterPurchaseEntryCaseUse"
import type { PurchaseEntry, PurchaseEntryLine } from "../../../../../core/feature/purchase/domain/entity/PurchaseEntry"
import type { Supplier } from "../../../../../core/feature/purchase/domain/entity/Supplier"
import type {
    PurchaseEntryRepository,
    SupplierRepository,
} from "../../../../../core/feature/purchase/domain/repository/purchase.repository"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"
import type {
    PaginatedResult,
    ProductRepository,
} from "../../../../../core/feature/product/domain/repository/product.repository"
import type { StockMovement } from "../../../../../core/feature/inventory/domain/entity/StockMovement"
import type { StockMovementRepository } from "../../../../../core/feature/inventory/domain/repository/stock-movement.repository"

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
    store: Map<string, Product>
    constructor(initial: Product[]) {
        this.store = new Map(initial.map((p) => [p.id, p]))
    }
    async getAll(_l: number, _o: number): Promise<PaginatedResult<Product>> {
        const items = [...this.store.values()]
        return { items, total: items.length }
    }
    async getById(id: string) {
        return this.store.get(id) ?? null
    }
    async getByCategory(c: string) {
        return [...this.store.values()].filter((p) => p.categoryId === c)
    }
    async create(p: Product) {
        this.store.set(p.id, p)
        return p
    }
    async update(id: string, patch: Partial<Product>) {
        const cur = this.store.get(id)
        if (!cur) throw new Error("missing")
        const next = { ...cur, ...patch }
        this.store.set(id, next)
        return next
    }
    async delete(id: string) {
        this.store.delete(id)
    }
}

class FakePurchaseRepo implements PurchaseEntryRepository {
    entries: PurchaseEntry[] = []
    lines: PurchaseEntryLine[] = []
    async createEntry(e: PurchaseEntry) {
        this.entries.push(e)
        return e
    }
    async createLine(l: PurchaseEntryLine) {
        this.lines.push(l)
        return l
    }
    async getEntryById(id: string) {
        return this.entries.find((e) => e.id === id) ?? null
    }
    async listEntries() {
        return this.entries
    }
    async listLinesByEntry(entryId: string) {
        return this.lines.filter((l) => l.entryId === entryId)
    }
    async listLinesByProduct(productId: string) {
        return this.lines.filter((l) => l.productId === productId)
    }
}

class FakeSupplierRepo implements SupplierRepository {
    items: Supplier[] = []
    async create(s: Supplier) {
        this.items.push(s)
        return s
    }
    async getById(id: string) {
        return this.items.find((s) => s.id === id) ?? null
    }
    async list() {
        return this.items
    }
    async update(id: string, patch: Partial<Supplier>) {
        const i = this.items.findIndex((s) => s.id === id)
        if (i < 0) throw new Error("missing")
        this.items[i] = { ...this.items[i], ...patch }
        return this.items[i]
    }
}

class FakeMovementRepo implements StockMovementRepository {
    created: StockMovement[] = []
    async create(m: StockMovement) {
        this.created.push(m)
        return m
    }
    async listByProduct() {
        return []
    }
    async listRecent() {
        return []
    }
    async listByEntry(entryId: string) {
        return this.created.filter((m) => m.entryId === entryId)
    }
}

describe("RegisterPurchaseEntryCaseUse B3.2", () => {
    it("creates entry+lines, bumps existence, movement entrada, lastUnitCost on purchase", async () => {
        const products = new FakeProductRepo([
            product({ id: "p1", existence: 5, reserved: 1 }),
            product({ id: "p2", existence: 0 }),
        ])
        const purchase = new FakePurchaseRepo()
        const suppliers = new FakeSupplierRepo()
        const movements = new FakeMovementRepo()
        const uc = new RegisterPurchaseEntryCaseUse(
            purchase,
            suppliers,
            products,
            movements,
            async () => "staff-9"
        )

        const result = await uc.execute({
            supplierName: "Proveedor X",
            reference: "F-001",
            lines: [
                { productId: "p1", quantity: 3, unitCost: 12.5, concept: "purchase" },
                { productId: "p2", quantity: 2, unitCost: 0, concept: "royalty" },
            ],
        })

        expect(result.lineCount).toBe(2)
        expect(result.totalCost).toBe(37.5)
        expect(result.userId).toBe("staff-9")
        expect(result.reference).toBe("F-001")
        expect(suppliers.items).toHaveLength(1)
        expect(suppliers.items[0].name).toBe("Proveedor X")
        expect(purchase.entries).toHaveLength(1)
        expect(purchase.lines).toHaveLength(2)

        expect(products.store.get("p1")!.existence).toBe(8)
        expect(products.store.get("p1")!.lastUnitCost).toBe(12.5)
        expect(products.store.get("p2")!.existence).toBe(2)
        expect(products.store.get("p2")!.lastUnitCost).toBeUndefined()

        expect(movements.created).toHaveLength(2)
        expect(movements.created.every((m) => m.type === "entrada")).toBe(true)
        expect(movements.created.every((m) => m.entryId === result.id)).toBe(true)
        expect(movements.created[0].balanceAfter).toBe(8)
        expect(movements.created[1].balanceAfter).toBe(2)
    })

    it("rejects empty lines", async () => {
        const uc = new RegisterPurchaseEntryCaseUse(
            new FakePurchaseRepo(),
            new FakeSupplierRepo(),
            new FakeProductRepo([]),
            new FakeMovementRepo()
        )
        await expect(uc.execute({ lines: [] })).rejects.toThrow(/al menos una línea/)
    })

    it("CUP converts lastUnitCost to USD with exchangeRate; line stays in CUP", async () => {
        const products = new FakeProductRepo([product({ id: "p1", existence: 0 })])
        const purchase = new FakePurchaseRepo()
        const uc = new RegisterPurchaseEntryCaseUse(
            purchase,
            new FakeSupplierRepo(),
            products,
            new FakeMovementRepo(),
            async () => "staff-9"
        )

        const result = await uc.execute({
            currency: "CUP",
            exchangeRate: 350,
            exchangeRateSource: "DIRECTORIO_CUBANO",
            lines: [{ productId: "p1", quantity: 2, unitCost: 700, concept: "purchase" }],
        })

        expect(result.currency).toBe("CUP")
        expect(result.exchangeRate).toBe(350)
        expect(result.totalCost).toBe(1400)
        expect(purchase.lines[0].unitCost).toBe(700)
        expect(products.store.get("p1")!.lastUnitCost).toBe(2)
        expect(products.store.get("p1")!.existence).toBe(2)
    })

    it("rejects CUP without valid exchangeRate", async () => {
        const uc = new RegisterPurchaseEntryCaseUse(
            new FakePurchaseRepo(),
            new FakeSupplierRepo(),
            new FakeProductRepo([product({ id: "p1" })]),
            new FakeMovementRepo()
        )
        await expect(
            uc.execute({
                currency: "CUP",
                lines: [{ productId: "p1", quantity: 1, unitCost: 100, concept: "purchase" }],
            })
        ).rejects.toThrow(/tasa/i)
    })
})
