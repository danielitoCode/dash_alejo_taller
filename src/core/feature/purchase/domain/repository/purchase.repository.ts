import type { Supplier } from "../entity/Supplier"
import type { PurchaseEntry, PurchaseEntryLine } from "../entity/PurchaseEntry"

export interface SupplierRepository {
    create(supplier: Supplier): Promise<Supplier>
    getById(id: string): Promise<Supplier | null>
    list(limit?: number): Promise<Supplier[]>
    update(id: string, patch: Partial<Supplier>): Promise<Supplier>
}

export type ListPurchaseEntriesOpts = {
    limit?: number
    /** Filtra por supplier_id en Appwrite si se pasa. */
    supplierId?: string
}

export interface PurchaseEntryRepository {
    createEntry(entry: PurchaseEntry): Promise<PurchaseEntry>
    createLine(line: PurchaseEntryLine): Promise<PurchaseEntryLine>
    getEntryById(id: string): Promise<PurchaseEntry | null>
    listEntries(limitOrOpts?: number | ListPurchaseEntriesOpts): Promise<PurchaseEntry[]>
    listLinesByEntry(entryId: string): Promise<PurchaseEntryLine[]>
    /** Líneas de compra que afectan un SKU (auditoría por producto). */
    listLinesByProduct(productId: string, limit?: number): Promise<PurchaseEntryLine[]>
}
