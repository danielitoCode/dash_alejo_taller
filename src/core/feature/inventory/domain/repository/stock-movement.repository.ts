import type { StockMovement } from "../entity/StockMovement"
import type { StockMovementType } from "../entity/enums"

export type TransactionId = string | undefined

export interface StockMovementRepository {
    create(movement: StockMovement, transactionId?: TransactionId): Promise<StockMovement>
    listByProduct(productId: string, limit?: number): Promise<StockMovement[]>
    listRecent(limit?: number, type?: StockMovementType): Promise<StockMovement[]>
    /** Movements vinculados a una factura de entrada (Core 3 B2). */
    listByEntry(entryId: string, limit?: number): Promise<StockMovement[]>
}
