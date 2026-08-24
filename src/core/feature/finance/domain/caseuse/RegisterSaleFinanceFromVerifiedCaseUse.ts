import type { Sale } from "../../../sale/domain/entity/Sale"
import type { SaleFinanceRepository } from "../repository/sale-finance.repository"
import type { SaleFinanceEvent } from "../entity/SaleFinanceEvent"
import { buildFinanceEventFromSale } from "../util/buildFinanceEventFromSale"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"

export type ProductCostLookup = (productId: string) => number | undefined | null

/**
 * Idempotente: si ya existe event por sale_id, no duplica.
 * Usado al confirmar desde panel (B4.2) y al reconciliar el resumen.
 */
export class RegisterSaleFinanceFromVerifiedCaseUse {
    constructor(
        private readonly financeRepo: SaleFinanceRepository,
        private readonly resolveUserId: () => Promise<string>
    ) {}

    async execute(
        sale: Sale,
        getLastUnitCost: ProductCostLookup
    ): Promise<SaleFinanceEvent> {
        const existing = await this.financeRepo.getBySaleId(sale.id)
        if (existing) {
            logger.info(`[RegisterSaleFinance] idempotent saleId=${sale.id}`)
            return existing
        }

        const costMap = new Map<string, number>()
        for (const line of sale.products ?? []) {
            if (!line.productId) continue
            const c = Number(getLastUnitCost(line.productId))
            costMap.set(line.productId, Number.isFinite(c) && c >= 0 ? c : 0)
        }

        const userId = await this.resolveUserId()
        const event = buildFinanceEventFromSale({
            sale,
            userId,
            lastUnitCostByProductId: costMap,
        })
        const created = await this.financeRepo.create(event)
        logger.info(
            `[RegisterSaleFinance] created saleId=${sale.id} revenue=${created.revenue} cogs=${created.cogs} margin=${created.margin}`
        )
        return created
    }
}
