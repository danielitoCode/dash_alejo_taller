import { writable } from "svelte/store"
import { financeContainer } from "../../di/finance.container"
import type { SaleFinanceEvent } from "../../domain/entity/SaleFinanceEvent"
import {
    aggregateFinanceSummary,
    emptyFinanceSummary,
    financeRangeLastDays,
    type FinanceSummary,
} from "../../domain/util/aggregateFinanceSummary"
import { salesMissingFinanceEvent } from "../../domain/util/salesMissingFinanceEvent"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"
import { saleContainer } from "../../../sale/di/sale.container"
import { productContainer } from "../../../product/di/product.container"
import { BuyState } from "../../../sale/domain/entity/enums"
import type { Sale } from "../../../sale/domain/entity/Sale"

interface FinanceState {
    loading: boolean
    events: SaleFinanceEvent[]
    summary: FinanceSummary
    rangeDays: number
    error: string | null
    reconciled: number
}

function createFinanceStore() {
    const { subscribe, update, set } = writable<FinanceState>({
        loading: false,
        events: [],
        summary: emptyFinanceSummary(),
        rangeDays: 30,
        error: null,
        reconciled: 0,
    })

    function inRange(sale: Sale, fromMs: number, toMs: number): boolean {
        const raw = sale.updatedAtIso || sale.createdAtIso || sale.date || ""
        const t = Date.parse(raw)
        if (!Number.isFinite(t)) return false
        return t >= fromMs && t <= toMs
    }

    /**
     * Core 4 B4: solo crea faltantes. Si ya existe event por sale_id, se omite.
     * RegisterSaleFinanceFromVerifiedCaseUse es además idempotente (doble red de seguridad).
     */
    async function reconcileMissing(fromIso: string, toIso: string): Promise<number> {
        let fixed = 0
        try {
            const sales = await saleContainer.useCases.getAll.execute()
            const fromMs = Date.parse(fromIso)
            const toMs = Date.parse(toIso)
            const verifiedInRange = sales.filter(
                (s) => s.verified === BuyState.VERIFIED && inRange(s, fromMs, toMs)
            )

            const existingIds = new Set<string>()
            for (const sale of verifiedInRange) {
                try {
                    const existing =
                        await financeContainer.repositories.saleFinance.getBySaleId(sale.id)
                    if (existing) existingIds.add(sale.id)
                } catch {
                    /* si falla lectura, intentamos create vía register (idempotente) */
                }
            }

            const missingIds = new Set(
                salesMissingFinanceEvent(
                    verifiedInRange.map((s) => s.id),
                    existingIds
                )
            )

            for (const sale of verifiedInRange) {
                if (!missingIds.has(sale.id)) continue
                try {
                    const costMap: Record<string, number> = {}
                    for (const line of sale.products ?? []) {
                        if (!line.productId || line.productId in costMap) continue
                        try {
                            const p = await productContainer.repositories.offlineFirst.getById(
                                line.productId
                            )
                            costMap[line.productId] = Number(p?.lastUnitCost) || 0
                        } catch {
                            costMap[line.productId] = 0
                        }
                    }
                    await financeContainer.useCases.registerFromVerified.execute(
                        sale,
                        (id) => costMap[id] ?? 0
                    )
                    fixed++
                } catch (e: any) {
                    logger.warn(
                        `[finance.store] reconcile skip saleId=${sale.id}: ${e?.message ?? e}`
                    )
                }
            }
        } catch (e: any) {
            logger.warn(`[finance.store] reconcile failed: ${e?.message ?? e}`)
        }
        return fixed
    }

    return {
        subscribe,
        async loadSummary(days: number = 30): Promise<FinanceSummary> {
            update((s) => ({ ...s, loading: true, error: null, rangeDays: days }))
            try {
                const { fromIso, toIso } = financeRangeLastDays(days)
                const reconciled = await reconcileMissing(fromIso, toIso)
                const events = await financeContainer.repositories.saleFinance.listByDateRange(
                    fromIso,
                    toIso,
                    100
                )
                const summary = aggregateFinanceSummary(events)
                update((s) => ({
                    ...s,
                    loading: false,
                    events,
                    summary,
                    error: null,
                    reconciled,
                }))
                return summary
            } catch (e: any) {
                const msg = e instanceof Error ? e.message : String(e)
                logger.error(msg, e?.stack)
                update((s) => ({
                    ...s,
                    loading: false,
                    error: msg,
                    summary: emptyFinanceSummary(),
                    events: [],
                    reconciled: 0,
                }))
                throw e
            }
        },
        reset() {
            set({
                loading: false,
                events: [],
                summary: emptyFinanceSummary(),
                rangeDays: 30,
                error: null,
                reconciled: 0,
            })
        },
    }
}

export const financeStore = createFinanceStore()
