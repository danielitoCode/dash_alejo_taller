import { describe, expect, it } from "vitest"
import {
    purchaseEntryFromDTO,
    purchaseEntryLineFromDTO,
    purchaseEntryLineToDTO,
    purchaseEntryToDTO,
    supplierFromDTO,
    supplierToDTO,
} from "../../../../core/feature/purchase/data/mapper/Mappers"
import type { PurchaseEntryDTO, PurchaseEntryLineDTO } from "../../../../core/feature/purchase/data/dto/PurchaseEntryDTO"
import type { SupplierDTO } from "../../../../core/feature/purchase/data/dto/SupplierDTO"
import { createPurchaseEntry } from "../../../../core/feature/purchase/domain/entity/PurchaseEntry"

describe("purchase mapper round-trip", () => {
    it("supplier", () => {
        const dto = {
            $id: "sup1",
            $collectionId: "supplier",
            $databaseId: "db",
            $createdAt: "2026-08-18T12:00:00.000Z",
            $updatedAt: "2026-08-18T12:00:00.000Z",
            $permissions: [],
            name: "Proveedor A",
            contact: "a@x.com",
        } as unknown as SupplierDTO
        const domain = supplierFromDTO(dto)
        expect(domain.name).toBe("Proveedor A")
        const write = supplierToDTO(domain)
        expect(write.name).toBe("Proveedor A")
        expect(write.contact).toBe("a@x.com")
    })

    it("purchase entry + line", () => {
        const entryDto = {
            $id: "e1",
            $collectionId: "purchase_entry",
            $databaseId: "db",
            $createdAt: "2026-08-18T12:00:00.000Z",
            $updatedAt: "2026-08-18T12:00:00.000Z",
            $permissions: [],
            entry_date: "2026-08-18T10:00:00.000Z",
            total_cost: 100,
            currency: "CUP",
            user_id: "u1",
            line_count: 1,
            supplier_id: "sup1",
        } as unknown as PurchaseEntryDTO
        const entry = purchaseEntryFromDTO(entryDto)
        expect(entry.totalCost).toBe(100)
        expect(entry.supplierId).toBe("sup1")
        const entryWrite = purchaseEntryToDTO(entry)
        expect(entryWrite.total_cost).toBe(100)
        expect(entryWrite.currency).toBe("CUP")

        const lineDto = {
            $id: "l1",
            $collectionId: "purchase_entry_line",
            $databaseId: "db",
            $createdAt: "2026-08-18T12:00:00.000Z",
            $updatedAt: "2026-08-18T12:00:00.000Z",
            $permissions: [],
            entry_id: "e1",
            product_id: "p1",
            quantity: 4,
            unit_cost: 25,
            concept: "purchase",
            line_cost: 100,
        } as unknown as PurchaseEntryLineDTO
        const line = purchaseEntryLineFromDTO(lineDto)
        expect(line.concept).toBe("purchase")
        expect(line.lineCost).toBe(100)
        const lineWrite = purchaseEntryLineToDTO(line)
        expect(lineWrite.unit_cost).toBe(25)
        expect(lineWrite.concept).toBe("purchase")
    })

    it("maps CUP snapshot exchange_rate fields round-trip", () => {
        const entryDto = {
            $id: "e-cup",
            $collectionId: "purchase_entry",
            $databaseId: "db",
            $createdAt: "2026-08-28T12:00:00.000Z",
            $updatedAt: "2026-08-28T12:00:00.000Z",
            $permissions: [],
            entry_date: "2026-08-28T10:00:00.000Z",
            total_cost: 700,
            currency: "CUP",
            user_id: "u1",
            line_count: 1,
            exchange_rate: 350,
            exchange_rate_at: "2026-08-28T10:00:00.000Z",
            exchange_rate_source: "DIRECTORIO_CUBANO",
        } as unknown as PurchaseEntryDTO

        const domain = purchaseEntryFromDTO(entryDto)
        expect(domain.currency).toBe("CUP")
        expect(domain.exchangeRate).toBe(350)
        expect(domain.exchangeRateAt).toBe("2026-08-28T10:00:00.000Z")
        expect(domain.exchangeRateSource).toBe("DIRECTORIO_CUBANO")

        const write = purchaseEntryToDTO(domain)
        expect(write.exchange_rate).toBe(350)
        expect(write.exchange_rate_source).toBe("DIRECTORIO_CUBANO")
        expect(write.exchange_rate_at).toBe("2026-08-28T10:00:00.000Z")
    })

    it("USD entry omits exchange rate on write", () => {
        const domain = createPurchaseEntry({
            id: "e-usd",
            entryDateIso: "2026-08-28T10:00:00.000Z",
            totalCost: 50,
            currency: "USD",
            userId: "u1",
            lineCount: 1,
        })
        const write = purchaseEntryToDTO(domain)
        expect(write.currency).toBe("USD")
        expect(write.exchange_rate).toBeUndefined()
        expect(write.exchange_rate_at).toBeUndefined()
        expect(write.exchange_rate_source).toBeUndefined()
    })
})
