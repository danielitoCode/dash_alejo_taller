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
})
