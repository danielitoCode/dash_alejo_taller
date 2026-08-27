import type { Supplier } from "../entity/Supplier"
import type { SupplierRepository } from "../repository/purchase.repository"

export type UpdateSupplierInput = {
    name?: string
    contact?: string
    notes?: string
}

export class UpdateSupplierCaseUse {
    constructor(private readonly supplierRepository: SupplierRepository) {}

    async execute(id: string, patch: UpdateSupplierInput): Promise<Supplier> {
        const supplierId = String(id || "").trim()
        if (!supplierId) throw new Error("supplier id is required")

        const data: Partial<Supplier> = {}
        if (patch.name !== undefined) {
            const name = String(patch.name).trim()
            if (!name) throw new Error("El nombre del proveedor no puede quedar vacío")
            data.name = name
        }
        if (patch.contact !== undefined) {
            data.contact = String(patch.contact ?? "")
        }
        if (patch.notes !== undefined) {
            data.notes = patch.notes == null ? "" : String(patch.notes)
        }

        return this.supplierRepository.update(supplierId, data)
    }
}
