import { createSupplier, type Supplier } from "../entity/Supplier"
import type { SupplierRepository } from "../repository/purchase.repository"

export type CreateSupplierInput = {
    name: string
    contact?: string
    notes?: string
    /** Si se omite, se genera un id único. */
    id?: string
}

export class CreateSupplierCaseUse {
    constructor(private readonly supplierRepository: SupplierRepository) {}

    async execute(input: CreateSupplierInput): Promise<Supplier> {
        const name = String(input.name || "").trim()
        if (!name) throw new Error("El nombre del proveedor es obligatorio")

        const id =
            String(input.id || "").trim() ||
            (typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `s-${Math.random().toString(36).slice(2, 12)}`)

        const entity = createSupplier({
            id,
            name,
            // Appwrite requiere contact: vacío si no hay dato real.
            contact:
                input.contact !== undefined && input.contact !== null
                    ? String(input.contact)
                    : "",
            notes: input.notes,
        })

        return this.supplierRepository.create(entity)
    }
}
