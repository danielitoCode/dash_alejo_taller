import type { Sale } from "../entity/Sale"
import { BuyState } from "../entity/enums"

export type SaleStatusFilter = "all" | BuyState

/**
 * Core1 4.1 — listado por estado de venta (BuyState).
 * Cola de supervisión: filtrar UNVERIFIED / VERIFIED / DELETED.
 */
export function filterSalesByStatus(
    sales: readonly Sale[],
    statusFilter: SaleStatusFilter
): Sale[] {
    if (statusFilter === "all") return [...sales]
    return sales.filter((s) => s.verified === statusFilter)
}

export function countSalesByStatus(sales: readonly Sale[]): {
    total: number
    pending: number
    verified: number
    rejected: number
} {
    let pending = 0
    let verified = 0
    let rejected = 0
    for (const s of sales) {
        if (s.verified === BuyState.UNVERIFIED) pending++
        else if (s.verified === BuyState.VERIFIED) verified++
        else if (s.verified === BuyState.DELETED) rejected++
    }
    return { total: sales.length, pending, verified, rejected }
}

export function saleStateLabel(state: BuyState): string {
    if (state === BuyState.UNVERIFIED) return "Pendiente"
    if (state === BuyState.DELETED) return "Rechazado"
    return "Confirmado"
}
