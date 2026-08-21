import { purchaseContainer } from "../../di/purchase.container"
import type { RegisterPurchaseEntryInput } from "../../domain/caseuse/RegisterPurchaseEntryCaseUse"
import type { PurchaseEntry } from "../../domain/entity/PurchaseEntry"
import type { Supplier } from "../../domain/entity/Supplier"

async function registerPurchaseEntry(input: RegisterPurchaseEntryInput): Promise<PurchaseEntry> {
    return purchaseContainer.useCases.registerPurchaseEntry.execute(input)
}

async function listSuppliers(limit = 50): Promise<Supplier[]> {
    return purchaseContainer.repositories.supplier.list(limit)
}

export const purchaseStore = {
    registerPurchaseEntry,
    listSuppliers,
}
