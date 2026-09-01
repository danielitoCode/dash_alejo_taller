/**
 * Evento financiero al confirmar una venta (VERIFIED).
 * UNVERIFIED / DELETED no generan este documento.
 *
 * Core 2: revenue / cogs / margin a nivel documento (COGS = Σ last_unit_cost × qty).
 * Core 4: líneas con unitCostSnapshot para histórico estable y margen por producto.
 */
export interface SaleFinanceLine {
    productId: string
    quantity: number
    unitPrice: number
    /** last_unit_cost congelado al confirm; no se relee del producto después. */
    unitCostSnapshot: number
    lineRevenue: number
    lineCogs: number
    lineMargin: number
}

export interface SaleFinanceEvent {
    id: string
    saleId: string
    revenue: number
    cogs: number
    margin: number
    userId: string
    atIso: string
    currency?: string
    /** Detalle auditable por producto (Core 4). Vacío en eventos legacy Core 2. */
    lines: SaleFinanceLine[]
}

export function createSaleFinanceLine(input: {
    productId: string
    quantity: number
    unitPrice: number
    unitCostSnapshot: number
}): SaleFinanceLine {
    const productId = String(input.productId || "").trim()
    if (!productId) throw new Error("sale finance line productId is required")

    const quantity = Math.trunc(Number(input.quantity))
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("sale finance line quantity must be an integer > 0")
    }

    const unitPrice = Number(input.unitPrice)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error("sale finance line unitPrice must be a number >= 0")
    }

    const unitCostSnapshot = Number(input.unitCostSnapshot)
    if (!Number.isFinite(unitCostSnapshot) || unitCostSnapshot < 0) {
        throw new Error("sale finance line unitCostSnapshot must be a number >= 0")
    }

    const lineRevenue = unitPrice * quantity
    const lineCogs = unitCostSnapshot * quantity
    return {
        productId,
        quantity,
        unitPrice,
        unitCostSnapshot,
        lineRevenue,
        lineCogs,
        lineMargin: lineRevenue - lineCogs,
    }
}

export function createSaleFinanceEvent(input: {
    id: string
    saleId: string
    revenue: number
    cogs: number
    margin?: number
    userId: string
    atIso: string
    currency?: string
    lines?: SaleFinanceLine[]
}): SaleFinanceEvent {
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

    const lines = Array.isArray(input.lines) ? input.lines : []

    return {
        id,
        saleId,
        revenue,
        cogs,
        margin,
        userId,
        atIso,
        currency: input.currency ? String(input.currency) : undefined,
        lines,
    }
}

/** Helper de dominio: COGS por línea = unitCost × qty (0 si no hay costo válido). */
export function cogsForLine(lastUnitCost: number | undefined | null, qty: number): number {
    const cost = Number(lastUnitCost)
    const q = Math.trunc(Number(qty))
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(q) || q <= 0) return 0
    return cost * q
}
