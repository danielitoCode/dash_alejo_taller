import type { Models } from "appwrite"

export interface SaleFinanceEventDTO extends Models.Document {
    sale_id: string
    revenue: number
    cogs: number
    margin: number
    user_id: string
    at: string
    currency?: string
}
