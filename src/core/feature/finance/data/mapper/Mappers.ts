import type { SaleFinanceEvent, SaleFinanceLine } from "../../domain/entity/SaleFinanceEvent"
import { createSaleFinanceEvent, createSaleFinanceLine } from "../../domain/entity/SaleFinanceEvent"
import type { SaleFinanceEventDTO } from "../dto/SaleFinanceEventDTO"

export type SaleFinanceEventWriteDTO = Pick<
    SaleFinanceEventDTO,
    "sale_id" | "revenue" | "cogs" | "margin" | "user_id" | "at" | "currency" | "lines_json"
> & { $id?: string }

function parseLinesJson(raw: string | undefined | null): SaleFinanceLine[] {
    if (!raw || !String(raw).trim()) return []
    try {
        const parsed = JSON.parse(String(raw)) as unknown
        if (!Array.isArray(parsed)) return []
        const lines: SaleFinanceLine[] = []
        for (const item of parsed) {
            if (!item || typeof item !== "object") continue
            const row = item as Record<string, unknown>
            const productId = String(row.productId ?? row.product_id ?? "").trim()
            if (!productId) continue
            const quantity = Math.trunc(Number(row.quantity) || 0)
            if (quantity <= 0) continue
            const unitPrice = Number(row.unitPrice ?? row.unit_price) || 0
            const unitCostSnapshot = Number(row.unitCostSnapshot ?? row.unit_cost_snapshot) || 0
            try {
                lines.push(
                    createSaleFinanceLine({
                        productId,
                        quantity,
                        unitPrice: unitPrice >= 0 ? unitPrice : 0,
                        unitCostSnapshot: unitCostSnapshot >= 0 ? unitCostSnapshot : 0,
                    })
                )
            } catch {
                // línea inválida: se omite
            }
        }
        return lines
    } catch {
        return []
    }
}

function serializeLines(lines: SaleFinanceLine[] | undefined): string | undefined {
    if (!lines || lines.length === 0) return undefined
    return JSON.stringify(
        lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            unitCostSnapshot: l.unitCostSnapshot,
            lineRevenue: l.lineRevenue,
            lineCogs: l.lineCogs,
            lineMargin: l.lineMargin,
        }))
    )
}

export function saleFinanceEventFromDTO(dto: SaleFinanceEventDTO): SaleFinanceEvent {
    return createSaleFinanceEvent({
        id: dto.$id,
        saleId: dto.sale_id,
        revenue: Number(dto.revenue) || 0,
        cogs: Number(dto.cogs) || 0,
        margin: Number(dto.margin) || 0,
        userId: dto.user_id,
        atIso: dto.at,
        currency: dto.currency,
        lines: parseLinesJson(dto.lines_json),
    })
}

export function saleFinanceEventToDTO(e: SaleFinanceEvent): SaleFinanceEventWriteDTO {
    const dto: SaleFinanceEventWriteDTO = {
        $id: e.id,
        sale_id: e.saleId,
        revenue: e.revenue,
        cogs: e.cogs,
        margin: e.margin,
        user_id: e.userId,
        at: e.atIso,
    }
    if (e.currency) dto.currency = e.currency
    const linesJson = serializeLines(e.lines)
    if (linesJson) dto.lines_json = linesJson
    return dto
}
