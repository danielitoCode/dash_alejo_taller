import type { Models } from "appwrite"

export interface PurchaseEntryDTO extends Models.Document {
    supplier_id?: string
    reference?: string
    entry_date: string
    total_cost: number
    currency: string
    user_id: string
    notes?: string
    line_count: number
    /** CUP por 1 USD — Appwrite: añadir atributos si aún no existen */
    exchange_rate?: number
    exchange_rate_at?: string
    exchange_rate_source?: string
}

export interface PurchaseEntryLineDTO extends Models.Document {
    entry_id: string
    product_id: string
    quantity: number
    unit_cost: number
    concept: string
    line_cost: number
}
