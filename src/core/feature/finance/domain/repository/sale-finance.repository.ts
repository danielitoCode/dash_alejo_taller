import type { SaleFinanceEvent } from "../entity/SaleFinanceEvent"

export interface SaleFinanceRepository {
    /** Idempotente preferible: no duplicar por sale_id */
    create(event: SaleFinanceEvent): Promise<SaleFinanceEvent>
    getBySaleId(saleId: string): Promise<SaleFinanceEvent | null>
    listByDateRange(fromIso: string, toIso: string, limit?: number): Promise<SaleFinanceEvent[]>
}
