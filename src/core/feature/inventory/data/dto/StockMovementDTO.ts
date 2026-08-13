import type { Models } from "appwrite"

/**
 * Documento Appwrite `stock_movement`.
 */
export interface StockMovementDTO extends Models.Document {
    product_id: string
    type: string
    quantity: number
    balance_after: number
    reason: string
    user_id: string
    sale_id?: string
    entry_id?: string
    created_at_iso?: string
}
