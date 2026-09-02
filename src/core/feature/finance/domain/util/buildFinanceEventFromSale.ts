import type { Sale } from "../../../sale/domain/entity/Sale"
import {
    cogsForLine,
    createSaleFinanceEvent,
    createSaleFinanceLine,
    type SaleFinanceEvent,
    type SaleFinanceLine,
} from "../entity/SaleFinanceEvent"

/**
 * Construye sale_finance_event a partir de una venta VERIFIED.
 * Core 2: COGS = Σ last_unit_cost × qty.
 * Core 4: además persiste líneas con unitCostSnapshot (histórico estable).
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

    const lines: SaleFinanceLine[] = []
    let sumLineRevenue = 0
    let cogs = 0

    for (const line of sale.products ?? []) {
        const productId = String(line.productId || "").trim()
        if (!productId) continue

        const qty = Math.trunc(Number(line.quantity) || 0)
        if (qty <= 0) continue

        const unitPrice = Number(line.price) || 0
        const rawCost = costMap.get(productId)
        const unitCostSnapshot =
            rawCost !== undefined && Number.isFinite(Number(rawCost)) && Number(rawCost) >= 0
                ? Number(rawCost)
                : 0

        const financeLine = createSaleFinanceLine({
            productId,
            quantity: qty,
            unitPrice: unitPrice >= 0 ? unitPrice : 0,
            unitCostSnapshot,
        })
        lines.push(financeLine)
        sumLineRevenue += financeLine.lineRevenue
        cogs += cogsForLine(unitCostSnapshot, qty)
    }

    let revenue = sumLineRevenue
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
        lines,
    })
}
