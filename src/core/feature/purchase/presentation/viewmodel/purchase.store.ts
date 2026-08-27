import { purchaseContainer } from "../../di/purchase.container"
import type { RegisterPurchaseEntryInput } from "../../domain/caseuse/RegisterPurchaseEntryCaseUse"
import type { PurchaseEntry, PurchaseEntryLine } from "../../domain/entity/PurchaseEntry"
import type { Supplier } from "../../domain/entity/Supplier"

async function registerPurchaseEntry(input: RegisterPurchaseEntryInput): Promise<PurchaseEntry> {
    return purchaseContainer.useCases.registerPurchaseEntry.execute(input)
}

async function listSuppliers(limit = 50): Promise<Supplier[]> {
    return purchaseContainer.useCases.listSuppliers.execute(limit)
}

async function listEntries(limit = 50): Promise<PurchaseEntry[]> {
    return purchaseContainer.repositories.purchaseEntry.listEntries(limit)
}

async function listLinesByEntry(entryId: string): Promise<PurchaseEntryLine[]> {
    return purchaseContainer.repositories.purchaseEntry.listLinesByEntry(entryId)
}

export const purchaseStore = {
    registerPurchaseEntry,
    listSuppliers,
    listEntries,
    listLinesByEntry,
}
