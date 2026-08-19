import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { StockMovementNetRepository } from "../data/repository/stock-movement.net.repository"
import type { StockMovementRepository } from "../domain/repository/stock-movement.repository"

const stockMovementNet = new StockMovementNetRepository(
    infrastructureContainer.appwrite.databases
)

export const inventoryContainer = {
    repositories: {
        stockMovement: stockMovementNet as StockMovementRepository,
    },
}
