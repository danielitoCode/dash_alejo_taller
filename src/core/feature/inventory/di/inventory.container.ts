import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { StockMovementNetRepository } from "../data/repository/stock-movement.net.repository"
import { StockMovementTursoRepository } from "../data/repository/stock-movement.turso.repository"
import type { StockMovementRepository } from "../domain/repository/stock-movement.repository"
import { isTursoDataProvider } from "../../../infrastructure/turso/turso.client"

const stockMovementNet = isTursoDataProvider()
    ? new StockMovementTursoRepository()
    : new StockMovementNetRepository(infrastructureContainer.appwrite.databases)

export const inventoryContainer = {
    repositories: {
        stockMovement: stockMovementNet as StockMovementRepository,
    },
}
