import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { authContainer } from "../../auth/di/auth.container"
import { inventoryContainer } from "../../inventory/di/inventory.container"
import { productContainer } from "../../product/di/product.container"
import { AppwriteTransactionRunner } from "../../../infrastructure/data/appwrite/AppwriteTransactionRunner"
import { SupplierNetRepository } from "../data/repository/supplier.net.repository"
import { PurchaseEntryNetRepository } from "../data/repository/purchase-entry.net.repository"
import type {
    PurchaseEntryRepository,
    SupplierRepository,
} from "../domain/repository/purchase.repository"
import { RegisterPurchaseEntryCaseUse } from "../domain/caseuse/RegisterPurchaseEntryCaseUse"
import { CancelPurchaseEntryCaseUse } from "../domain/caseuse/CancelPurchaseEntryCaseUse"
import { ListSuppliersCaseUse } from "../domain/caseuse/ListSuppliersCaseUse"
import { CreateSupplierCaseUse } from "../domain/caseuse/CreateSupplierCaseUse"
import { UpdateSupplierCaseUse } from "../domain/caseuse/UpdateSupplierCaseUse"
import { ListPurchaseEntriesCaseUse } from "../domain/caseuse/ListPurchaseEntriesCaseUse"
import { GetPurchaseEntryDetailCaseUse } from "../domain/caseuse/GetPurchaseEntryDetailCaseUse"

const databases = infrastructureContainer.appwrite.databases
const supplierNet = new SupplierNetRepository(databases)
const purchaseEntryNet = new PurchaseEntryNetRepository(databases)
const purchaseTransactionRunner = new AppwriteTransactionRunner(databases)

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
    resolveStaffUserId,
    purchaseTransactionRunner
)

const cancelPurchaseEntryCaseUse = new CancelPurchaseEntryCaseUse(
    purchaseEntryNet,
    productContainer.repositories.offlineFirst,
    inventoryContainer.repositories.stockMovement,
    purchaseTransactionRunner,
    resolveStaffUserId
)

export const purchaseContainer = {
    repositories: {
        supplier: supplierNet as SupplierRepository,
        purchaseEntry: purchaseEntryNet as PurchaseEntryRepository,
    },
    useCases: {
        registerPurchaseEntry: registerPurchaseEntryCaseUse,
        cancelPurchaseEntry: cancelPurchaseEntryCaseUse,
        listSuppliers: new ListSuppliersCaseUse(supplierNet),
        createSupplier: new CreateSupplierCaseUse(supplierNet),
        updateSupplier: new UpdateSupplierCaseUse(supplierNet),
        listPurchaseEntries: new ListPurchaseEntriesCaseUse(purchaseEntryNet),
        getPurchaseEntryDetail: new GetPurchaseEntryDetailCaseUse(
            purchaseEntryNet,
            supplierNet,
            inventoryContainer.repositories.stockMovement
        ),
    },
}
