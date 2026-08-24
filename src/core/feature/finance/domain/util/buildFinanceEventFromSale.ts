import type { Sale } from "../../../sale/domain/entity/Sale"
import { cogsForLine, createSaleFinanceEvent, type SaleFinanceEvent } from "../entity/SaleFinanceEvent"

/**
 * Construye sale_finance_event a partir de una venta VERIFIED.
 * COGS = Σ last_unit_cost × qty (Core 2).
 */
export function buildFinanceEventFromSale(input: {
    sale: Sale
    userId: string
    lastUnitCostByProductId: ReadonlyMap<string, number> | Record<string, number>
    eventId?: string
}): SaleFinanceEvent {
    const { sale, userId } = input
    const costMap =
        input.lastUnitCostByProductId instanceof Map
            ? input.lastUnitCostByProductId
            : new Map(Object.entries(input.lastUnitCostByProductId))

    let revenue = 0
    let cogs = 0
    for (const line of sale.products ?? []) {
        const qty = Math.max(0, Number(line.quantity) || 0)
        const price = Number(line.price) || 0
        revenue += qty * price
        const unitCost = costMap.get(line.productId) ?? 0
        cogs += cogsForLine(unitCost, qty)
    }
    if (Number.isFinite(sale.amount) && sale.amount > 0) {
        revenue = Number(sale.amount)
    }

    const atIso =
        sale.updatedAtIso ||
        sale.createdAtIso ||
        (sale.date ? new Date(sale.date).toISOString() : new Date().toISOString())

    return createSaleFinanceEvent({
        id: input.eventId || `fin_${sale.id}`,
        saleId: sale.id,
        revenue,
        cogs,
        margin: revenue - cogs,
        userId: userId || "staff",
        atIso: Number.isFinite(Date.parse(atIso)) ? atIso : new Date().toISOString(),
        currency: sale.currency || undefined,
    })
}
