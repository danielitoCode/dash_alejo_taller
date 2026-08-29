import type { StockMovement } from "../../../inventory/domain/entity/StockMovement"
import type { StockMovementRepository } from "../../../inventory/domain/repository/stock-movement.repository"
import type { PurchaseEntry, PurchaseEntryLine } from "../entity/PurchaseEntry"
import type { Supplier } from "../entity/Supplier"
import type {
    PurchaseEntryRepository,
    SupplierRepository,
} from "../repository/purchase.repository"

export type PurchaseEntryDetail = {
    entry: PurchaseEntry
    lines: PurchaseEntryLine[]
    supplier: Supplier | null
    movements: StockMovement[]
}

/** Core 3 B2 — cabecera + líneas + proveedor + movements por entry_id. */
export class GetPurchaseEntryDetailCaseUse {
    constructor(
        private readonly purchaseRepo: PurchaseEntryRepository,
        private readonly supplierRepo: SupplierRepository,
        private readonly movementRepo: StockMovementRepository
    ) {}

    async execute(entryId: string): Promise<PurchaseEntryDetail> {
        const id = String(entryId || "").trim()
        if (!id) throw new Error("entryId is required")

        const entry = await this.purchaseRepo.getEntryById(id)
        if (!entry) throw new Error(`Entrada no encontrada: ${id}`)

        const [lines, movements, supplier] = await Promise.all([
            this.purchaseRepo.listLinesByEntry(id),
            this.movementRepo.listByEntry(id),
            entry.supplierId
                ? this.supplierRepo.getById(entry.supplierId)
                : Promise.resolve(null),
        ])

        return {
            entry: { ...entry, lines, lineCount: lines.length || entry.lineCount },
            lines,
            supplier,
            movements,
        }
    }
}
