import { describe, expect, it } from "vitest"
import { createSupplier } from "../../../../core/feature/purchase/domain/entity/Supplier"
import {
    supplierFromDTO,
    supplierToDTO,
} from "../../../../core/feature/purchase/data/mapper/Mappers"
import type { SupplierDTO } from "../../../../core/feature/purchase/data/dto/SupplierDTO"

describe("supplier mapper (Core3 B1)", () => {
    it("supplierToDTO always emits contact as string (Appwrite required)", () => {
        const s = createSupplier({
            id: "s1",
            name: "Distribuidora Norte",
        })
        const dto = supplierToDTO(s)
        expect(dto.name).toBe("Distribuidora Norte")
        expect(dto.contact).toBe("")
        expect(typeof dto.contact).toBe("string")
        expect(dto.$id).toBe("s1")
    })

    it("supplierToDTO trims contact and omits empty notes", () => {
        const s = createSupplier({
            id: "s2",
            name: "Acme",
            contact: "  +53 5 123 4567  ",
            notes: "  ",
        })
        const dto = supplierToDTO(s)
        expect(dto.contact).toBe("+53 5 123 4567")
        expect(dto.notes).toBeUndefined()
    })

    it("supplierFromDTO maps Appwrite document", () => {
        const raw = {
            $id: "doc-1",
            name: "Proveedor X",
            contact: "",
            notes: null,
        } as unknown as SupplierDTO
        const s = supplierFromDTO(raw)
        expect(s.id).toBe("doc-1")
        expect(s.name).toBe("Proveedor X")
        expect(s.contact === "" || s.contact === undefined).toBe(true)
    })
})
