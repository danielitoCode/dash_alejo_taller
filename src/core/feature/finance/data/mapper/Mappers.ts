import type { SaleFinanceEvent } from "../../domain/entity/SaleFinanceEvent"
import { createSaleFinanceEvent } from "../../domain/entity/SaleFinanceEvent"
import type { SaleFinanceEventDTO } from "../dto/SaleFinanceEventDTO"

export type SaleFinanceEventWriteDTO = Pick<
    SaleFinanceEventDTO,
    "sale_id" | "revenue" | "cogs" | "margin" | "user_id" | "at" | "currency"
> & { $id?: string }

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
    return dto
}
