import type { Supplier } from "../entity/Supplier"
import type { PurchaseEntry, PurchaseEntryLine } from "../entity/PurchaseEntry"

export type TransactionId = string | undefined

export interface SupplierRepository {
    create(supplier: Supplier, transactionId?: TransactionId): Promise<Supplier>
    getById(id: string, transactionId?: TransactionId): Promise<Supplier | null>
    list(limit?: number): Promise<Supplier[]>
    update(id: string, patch: Partial<Supplier>, transactionId?: TransactionId): Promise<Supplier>
}

export type ListPurchaseEntriesOpts = {
    limit?: number
    /** Filtra por supplier_id en Appwrite si se pasa. */
    supplierId?: string
}

export interface PurchaseEntryRepository {
    createEntry(entry: PurchaseEntry, transactionId?: TransactionId): Promise<PurchaseEntry>
    createLine(line: PurchaseEntryLine, transactionId?: TransactionId): Promise<PurchaseEntryLine>
    getEntryById(id: string, transactionId?: TransactionId): Promise<PurchaseEntry | null>
    listEntries(limitOrOpts?: number | ListPurchaseEntriesOpts): Promise<PurchaseEntry[]>
    listLinesByEntry(entryId: string, transactionId?: TransactionId): Promise<PurchaseEntryLine[]>
    /** Líneas de compra que afectan un SKU (auditoría por producto). */
    listLinesByProduct(productId: string, limit?: number): Promise<PurchaseEntryLine[]>
}
