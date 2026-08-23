import { writable } from "svelte/store"
import { financeContainer } from "../../di/finance.container"
import type { SaleFinanceEvent } from "../../domain/entity/SaleFinanceEvent"
import {
    aggregateFinanceSummary,
    emptyFinanceSummary,
    financeRangeLastDays,
    type FinanceSummary,
} from "../../domain/util/aggregateFinanceSummary"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"

interface FinanceState {
    loading: boolean
    events: SaleFinanceEvent[]
    summary: FinanceSummary
    rangeDays: number
    error: string | null
}

function createFinanceStore() {
    const { subscribe, update, set } = writable<FinanceState>({
        loading: false,
        events: [],
        summary: emptyFinanceSummary(),
        rangeDays: 30,
        error: null,
    })

    return {
        subscribe,
        async loadSummary(days: number = 30): Promise<FinanceSummary> {
            update((s) => ({ ...s, loading: true, error: null, rangeDays: days }))
            try {
                const { fromIso, toIso } = financeRangeLastDays(days)
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
            })
        },
    }
}

export const financeStore = createFinanceStore()
