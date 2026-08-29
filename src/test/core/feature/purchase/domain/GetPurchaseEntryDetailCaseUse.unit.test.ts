import { describe, expect, it } from "vitest"
import { GetPurchaseEntryDetailCaseUse } from "../../../../../core/feature/purchase/domain/caseuse/GetPurchaseEntryDetailCaseUse"
import type { PurchaseEntry, PurchaseEntryLine } from "../../../../../core/feature/purchase/domain/entity/PurchaseEntry"
import type { Supplier } from "../../../../../core/feature/purchase/domain/entity/Supplier"
import type {
    PurchaseEntryRepository,
    SupplierRepository,
} from "../../../../../core/feature/purchase/domain/repository/purchase.repository"
import type { StockMovement } from "../../../../../core/feature/inventory/domain/entity/StockMovement"
import type { StockMovementRepository } from "../../../../../core/feature/inventory/domain/repository/stock-movement.repository"

class FakePurchase implements PurchaseEntryRepository {
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

class FakeSupplier implements SupplierRepository {
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

class FakeMovements implements StockMovementRepository {
    items: StockMovement[] = []
    async create(m: StockMovement) {
        this.items.push(m)
        return m
    }
    async listByProduct() {
        return []
    }
    async listRecent() {
        return []
    }
    async listByEntry(entryId: string) {
        return this.items.filter((m) => m.entryId === entryId)
    }
}

describe("GetPurchaseEntryDetailCaseUse (Core3 B2)", () => {
    it("assembles entry + lines + supplier + movements by entry_id", async () => {
        const purchase = new FakePurchase()
        const suppliers = new FakeSupplier()
        const movements = new FakeMovements()

        purchase.entries.push({
            id: "e1",
            supplierId: "s1",
            entryDateIso: "2026-08-20T12:00:00.000Z",
            totalCost: 50,
            currency: "CUP",
            userId: "staff",
            lineCount: 1,
            reference: "F-9",
        })
        purchase.lines.push({
            id: "l1",
            entryId: "e1",
            productId: "p1",
            quantity: 2,
            unitCost: 25,
            concept: "purchase",
            lineCost: 50,
        })
        suppliers.items.push({ id: "s1", name: "Acme", contact: "" })
        movements.items.push({
            id: "m1",
            productId: "p1",
            type: "entrada",
            quantity: 2,
            balanceAfter: 10,
            reason: "purchase_entry",
            userId: "staff",
            entryId: "e1",
        })

        const uc = new GetPurchaseEntryDetailCaseUse(purchase, suppliers, movements)
        const detail = await uc.execute("e1")

        expect(detail.entry.id).toBe("e1")
        expect(detail.lines).toHaveLength(1)
        expect(detail.supplier?.name).toBe("Acme")
        expect(detail.movements).toHaveLength(1)
        expect(detail.movements[0].entryId).toBe("e1")
    })

    it("throws when entry missing", async () => {
        const uc = new GetPurchaseEntryDetailCaseUse(
            new FakePurchase(),
            new FakeSupplier(),
            new FakeMovements()
        )
        await expect(uc.execute("nope")).rejects.toThrow(/no encontrada/)
    })
})
