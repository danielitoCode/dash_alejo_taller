import type { Supplier } from "../entity/Supplier"
import type { SupplierRepository } from "../repository/purchase.repository"

export class ListSuppliersCaseUse {
    constructor(private readonly supplierRepository: SupplierRepository) {}

    async execute(limit = 100): Promise<Supplier[]> {
        const safe = Math.min(Math.max(1, Math.trunc(limit) || 100), 100)
        return this.supplierRepository.list(safe)
    }
}
