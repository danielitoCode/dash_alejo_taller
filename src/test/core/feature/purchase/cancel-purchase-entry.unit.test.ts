import { describe, expect, it, vi } from "vitest"
import { CancelPurchaseEntryCaseUse } from "../../../../core/feature/purchase/domain/caseuse/CancelPurchaseEntryCaseUse"
import type { PurchaseEntry, PurchaseEntryLine } from "../../../../core/feature/purchase/domain/entity/PurchaseEntry"
import type { PurchaseEntryRepository } from "../../../../core/feature/purchase/domain/repository/purchase.repository"
import type { ProductRepository } from "../../../../core/feature/product/domain/repository/product.repository"
import type { StockMovementRepository } from "../../../../core/feature/inventory/domain/repository/stock-movement.repository"
import type { TransactionRunner } from "../../../../core/feature/purchase/domain/repository/transaction.repository"

function entry(status: "ACTIVE" | "CANCELLED" = "ACTIVE"): PurchaseEntry {
    return {
        id: "entry-1",
        entryDateIso: "2026-08-29T10:00:00.000Z",
        totalCost: 100,
        currency: "USD",
        userId: "staff-1",
        lineCount: 2,
        status,
    }
}

function line(id: string, productId: string, quantity: number): PurchaseEntryLine {
    return {
        id,
        entryId: "entry-1",
        productId,
        quantity,
        unitCost: 10,
        concept: "purchase",
        lineCost: quantity * 10,
    }
}

describe("CancelPurchaseEntryCaseUse", () => {
    it("reverts all products atomically and never changes reserved", async () => {
        const productUpdate = vi.fn()
        const movementCreate = vi.fn()
        const statusUpdate = vi.fn()

        const products = new Map([
            ["p1", { id: "p1", existence: 12, reserved: 2 }],
            ["p2", { id: "p2", existence: 8, reserved: 1 }],
        ])

        const purchaseRepo: PurchaseEntryRepository = {
            createEntry: vi.fn(),
            createLine: vi.fn(),
            getEntryById: vi.fn(async () => entry()),
            updateEntry: statusUpdate,
            listEntries: vi.fn(),
            listLinesByEntry: vi.fn(async () => [line("l1", "p1", 5), line("l2", "p2", 3)]),
            listLinesByProduct: vi.fn(),
        }

        const productRepo = {
            getById: vi.fn(async (id: string) => products.get(id)),
            update: productUpdate,
        } as unknown as ProductRepository

        const movementRepo = {
            create: movementCreate,
        } as unknown as StockMovementRepository

        const runner: TransactionRunner = {
            run: vi.fn(async (work) => work("tx-1")),
        }

        const useCase = new CancelPurchaseEntryCaseUse(
            purchaseRepo,
            productRepo,
            movementRepo,
            runner,
            async () => "staff-2"
        )

        const result = await useCase.execute("entry-1")

        expect(result).toEqual({ entryId: "entry-1", reversedLines: 2 })
        expect(runner.run).toHaveBeenCalledOnce()
        expect(productRepo.getById).toHaveBeenCalledWith("p1", "tx-1")
        expect(productRepo.getById).toHaveBeenCalledWith("p2", "tx-1")
        expect(productUpdate).toHaveBeenCalledWith("p1", { existence: 7 }, "tx-1")
        expect(productUpdate).toHaveBeenCalledWith("p2", { existence: 5 }, "tx-1")
        expect(productUpdate.mock.calls.every(([, patch]) => !("reserved" in patch) && !("lastUnitCost" in patch))).toBe(true)
        expect(movementCreate).toHaveBeenCalledTimes(2)
        expect(movementCreate.mock.calls.every(([m]) => m.type === "ajuste" && m.reason === "purchase_entry_reversal" && m.entryId === "entry-1")).toBe(true)
        expect(statusUpdate).toHaveBeenCalledWith("entry-1", { status: "CANCELLED" }, "tx-1")
    })

    it("aggregates repeated product lines before reversing stock", async () => {
        const productUpdate = vi.fn()
        const movementCreate = vi.fn()
        const purchaseRepo: PurchaseEntryRepository = {
            createEntry: vi.fn(), createLine: vi.fn(), getEntryById: vi.fn(async () => entry()),
            updateEntry: vi.fn(), listEntries: vi.fn(),
            listLinesByEntry: vi.fn(async () => [line("l1", "p1", 2), line("l2", "p1", 3)]),
            listLinesByProduct: vi.fn(),
        }
        const productRepo = {
            getById: vi.fn(async () => ({ id: "p1", existence: 10, reserved: 1 })),
            update: productUpdate,
        } as unknown as ProductRepository
        const movementRepo = { create: movementCreate } as unknown as StockMovementRepository
        const runner: TransactionRunner = { run: vi.fn(async (work) => work("tx-2")) }

        const useCase = new CancelPurchaseEntryCaseUse(purchaseRepo, productRepo, movementRepo, runner)
        await useCase.execute("entry-1")

        expect(productUpdate).toHaveBeenCalledTimes(1)
        expect(productUpdate).toHaveBeenCalledWith("p1", { existence: 5 }, "tx-2")
        expect(movementCreate).toHaveBeenCalledTimes(1)
        expect(movementCreate).toHaveBeenCalledWith(expect.objectContaining({ quantity: 5, balanceAfter: 5 }), "tx-2")
    })

    it("rejects before mutation when reserved stock would be broken", async () => {
        const productUpdate = vi.fn()
        const movementCreate = vi.fn()
        const statusUpdate = vi.fn()
        const purchaseRepo: PurchaseEntryRepository = {
            createEntry: vi.fn(), createLine: vi.fn(), getEntryById: vi.fn(async () => entry()),
            updateEntry: statusUpdate, listEntries: vi.fn(),
            listLinesByEntry: vi.fn(async () => [line("l1", "p1", 5)]),
            listLinesByProduct: vi.fn(),
        }
        const productRepo = {
            getById: vi.fn(async () => ({ id: "p1", existence: 6, reserved: 2 })),
            update: productUpdate,
        } as unknown as ProductRepository
        const movementRepo = { create: movementCreate } as unknown as StockMovementRepository
        const runner: TransactionRunner = { run: vi.fn(async (work) => work("tx-3")) }

        const useCase = new CancelPurchaseEntryCaseUse(purchaseRepo, productRepo, movementRepo, runner)

        await expect(useCase.execute("entry-1")).rejects.toThrow(/existence \(1\) < reserved \(2\)/)
        expect(productUpdate).not.toHaveBeenCalled()
        expect(movementCreate).not.toHaveBeenCalled()
        expect(statusUpdate).not.toHaveBeenCalled()
    })

    it("is idempotency-safe for an already cancelled entry", async () => {
        const purchaseRepo: PurchaseEntryRepository = {
            createEntry: vi.fn(), createLine: vi.fn(), getEntryById: vi.fn(async () => entry("CANCELLED")),
            updateEntry: vi.fn(), listEntries: vi.fn(), listLinesByEntry: vi.fn(), listLinesByProduct: vi.fn(),
        }
        const productRepo = { getById: vi.fn(), update: vi.fn() } as unknown as ProductRepository
        const movementRepo = { create: vi.fn() } as unknown as StockMovementRepository
        const runner: TransactionRunner = { run: vi.fn(async (work) => work("tx-4")) }

        const useCase = new CancelPurchaseEntryCaseUse(purchaseRepo, productRepo, movementRepo, runner)
        await expect(useCase.execute("entry-1")).rejects.toThrow(/already cancelled/)
        expect(productRepo.update).not.toHaveBeenCalled()
        expect(movementRepo.create).not.toHaveBeenCalled()
    })
})
