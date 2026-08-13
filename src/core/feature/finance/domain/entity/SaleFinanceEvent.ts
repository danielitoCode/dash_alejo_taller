/**
 * Evento financiero al confirmar una venta (VERIFIED).
 * UNVERIFIED no genera este documento.
 * COGS = last_unit_cost × qty (decisión Core 2).
 */
export interface SaleFinanceEvent {
    id: string
    saleId: string
    revenue: number
    cogs: number
    margin: number
    userId: string
    atIso: string
    currency?: string
}

export function createSaleFinanceEvent(input: SaleFinanceEvent): SaleFinanceEvent {
    const id = String(input.id || "").trim()
    if (!id) throw new Error("sale finance event id is required")
    const saleId = String(input.saleId || "").trim()
    if (!saleId) throw new Error("saleId is required")
    const userId = String(input.userId || "").trim()
    if (!userId) throw new Error("userId is required")
    const atIso = String(input.atIso || "").trim()
    if (!atIso) throw new Error("atIso is required")

    const revenue = Number(input.revenue)
    const cogs = Number(input.cogs)
    if (!Number.isFinite(revenue) || revenue < 0) {
        throw new Error("revenue must be a number >= 0")
    }
    if (!Number.isFinite(cogs) || cogs < 0) {
        throw new Error("cogs must be a number >= 0")
    }

    const margin =
        input.margin !== undefined && Number.isFinite(Number(input.margin))
            ? Number(input.margin)
            : revenue - cogs

    return {
        id,
        saleId,
        revenue,
        cogs,
        margin,
        userId,
        atIso,
        currency: input.currency ? String(input.currency) : undefined,
    }
}

/** Helper de dominio: COGS por línea = lastUnitCost × qty (0 si no hay costo). */
export function cogsForLine(lastUnitCost: number | undefined | null, qty: number): number {
    const cost = Number(lastUnitCost)
    const q = Math.trunc(Number(qty))
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(q) || q <= 0) return 0
    return cost * q
}
