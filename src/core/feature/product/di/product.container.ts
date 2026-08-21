import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { authContainer } from "../../auth/di/auth.container"
import { inventoryContainer } from "../../inventory/di/inventory.container"
import ProductNetRepository from "../data/repository/product.net.repository"
import { ProductOfflineFirstRepository } from "../data/repository/product.offline-first.repository"
import { GetAllProductCaseUse } from "../domain/caseuse/GetAllProductCaseUse"
import { GetProductByIdCaseUse } from "../domain/caseuse/GetProductByIdCaseUse"
import { SaveProductCaseUse } from "../domain/caseuse/SaveProductCaseUse"
import { DeleteProductCaseUse } from "../domain/caseuse/DeleteProductCaseUse"
import { UpdateProductPriceCaseUse } from "../domain/caseuse/UpdateProductPriceCaseUse"
import { UpdateProductCatalogCaseUse } from "../domain/caseuse/UpdateProductCatalogCaseUse"
import { RegisterStockEntryCaseUse } from "../domain/caseuse/RegisterStockEntryCaseUse"

const database = infrastructureContainer.appwrite.databases

const productNetRepository = new ProductNetRepository(database)
const productOfflineFirstRepository = new ProductOfflineFirstRepository(productNetRepository)

const getAllProductsCaseUse = new GetAllProductCaseUse(productOfflineFirstRepository)
const deletedProductCaseUse = new DeleteProductCaseUse(productOfflineFirstRepository)
const getProductByIdCaseUse = new GetProductByIdCaseUse(productOfflineFirstRepository)
const updateProductCatalogCaseUse = new UpdateProductCatalogCaseUse(productOfflineFirstRepository)
const modifyProductPriceCaseUse = new UpdateProductPriceCaseUse(productOfflineFirstRepository)
const saveProductCaseUse = new SaveProductCaseUse(productOfflineFirstRepository)

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

const registerStockEntryCaseUse = new RegisterStockEntryCaseUse(
    productOfflineFirstRepository,
    inventoryContainer.repositories.stockMovement,
    resolveStaffUserId
)

export const productContainer = {
    repositories: {
        net: productNetRepository,
        offlineFirst: productOfflineFirstRepository,
    },
    useCases: {
        getAll: getAllProductsCaseUse,
        getById: getProductByIdCaseUse,
        create: saveProductCaseUse,
        updateCatalog: updateProductCatalogCaseUse,
        updatePrice: modifyProductPriceCaseUse,
        delete: deletedProductCaseUse,
        registerStockEntry: registerStockEntryCaseUse,
    },
}
