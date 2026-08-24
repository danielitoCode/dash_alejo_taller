import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { authContainer } from "../../auth/di/auth.container"
import { inventoryContainer } from "../../inventory/di/inventory.container"
import { productContainer } from "../../product/di/product.container"
import { SupplierNetRepository } from "../data/repository/supplier.net.repository"
import { PurchaseEntryNetRepository } from "../data/repository/purchase-entry.net.repository"
import type {
    PurchaseEntryRepository,
    SupplierRepository,
} from "../domain/repository/purchase.repository"
import { RegisterPurchaseEntryCaseUse } from "../domain/caseuse/RegisterPurchaseEntryCaseUse"

const databases = infrastructureContainer.appwrite.databases
const supplierNet = new SupplierNetRepository(databases)
const purchaseEntryNet = new PurchaseEntryNetRepository(databases)

async function resolveStaffUserId(): Promise<string> {
    try {
        const user = await authContainer.useCases.accounts.getCurrentUser()
        const id = String(
            (user as { $id?: string })?.$id || (user as { id?: string })?.id || ""
        ).trim()
        return id || "staff"
    } catch {
        return "staff"
    }
}

const registerPurchaseEntryCaseUse = new RegisterPurchaseEntryCaseUse(
    purchaseEntryNet,
    supplierNet,
    productContainer.repositories.offlineFirst,
    inventoryContainer.repositories.stockMovement,
    resolveStaffUserId
)

export const purchaseContainer = {
    repositories: {
        supplier: supplierNet as SupplierRepository,
        purchaseEntry: purchaseEntryNet as PurchaseEntryRepository,
    },
    useCases: {
        registerPurchaseEntry: registerPurchaseEntryCaseUse,
    },
}
