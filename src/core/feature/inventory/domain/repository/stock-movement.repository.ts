import type { StockMovement } from "../entity/StockMovement"
import type { StockMovementType } from "../entity/enums"

export interface StockMovementRepository {
    create(movement: StockMovement): Promise<StockMovement>
    listByProduct(productId: string, limit?: number): Promise<StockMovement[]>
    listRecent(limit?: number, type?: StockMovementType): Promise<StockMovement[]>
}
