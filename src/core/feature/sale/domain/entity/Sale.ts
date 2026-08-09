import { type BuyState, type DeliveryType } from "./enums"

/**
 * Dominio Sale — lectura de supervisión (Core1 4.2).
 * currency es la del documento (la eligió el cliente); no reconvertir en panel.
 */
export interface Sale {
    id: string
    date: string
    amount: number
    /** Moneda del pedido (Appwrite). Vacío → UI puede mostrar sin símbolo forzado. */
    currency?: string | null
    verified: BuyState
    products: SaleItem[]
    userId: string
    deliveryType?: DeliveryType | null
    createdAtIso?: string
    updatedAtIso?: string
}

export interface SaleItem {
    productId: string
    quantity: number
    price: number
}

export function saleLineTotal(item: SaleItem): number {
    const q = Number(item.quantity) || 0
    const p = Number(item.price) || 0
    return q * p
}
