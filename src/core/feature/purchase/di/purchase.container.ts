import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { SupplierNetRepository } from "../data/repository/supplier.net.repository"
import { PurchaseEntryNetRepository } from "../data/repository/purchase-entry.net.repository"
import type {
    PurchaseEntryRepository,
    SupplierRepository,
} from "../domain/repository/purchase.repository"

const databases = infrastructureContainer.appwrite.databases
const supplierNet = new SupplierNetRepository(databases)
const purchaseEntryNet = new PurchaseEntryNetRepository(databases)

export const purchaseContainer = {
    repositories: {
        supplier: supplierNet as SupplierRepository,
        purchaseEntry: purchaseEntryNet as PurchaseEntryRepository,
    },
}
