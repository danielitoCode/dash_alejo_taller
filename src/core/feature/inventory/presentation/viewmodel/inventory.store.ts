import { inventoryContainer } from "../../di/inventory.container"
import type { StockMovement } from "../../domain/entity/StockMovement"
import type { StockMovementType } from "../../domain/entity/enums"

async function listRecentMovements(
    limit = 50,
    type?: StockMovementType
): Promise<StockMovement[]> {
    return inventoryContainer.repositories.stockMovement.listRecent(limit, type)
}

async function listMovementsByProduct(
    productId: string,
    limit = 50
): Promise<StockMovement[]> {
    return inventoryContainer.repositories.stockMovement.listByProduct(productId, limit)
}

export const inventoryStore = {
    listRecentMovements,
    listMovementsByProduct,
}
