import type { SaleItemDTO } from "./SaleItemDTO"
import type { Models } from "appwrite"

export interface SaleDTO extends Models.Document {
    date: string
    amount: number
    /** Código de moneda del cliente (USD, CUP, …). */
    currency?: string | null
    verified?: string
    buy_state?: string
    products: SaleItemDTO[]
    user_id: string
    deliveryType?: string | null
    delivery_type?: string | null
    $createdAt: string
    $updatedAt: string
}
