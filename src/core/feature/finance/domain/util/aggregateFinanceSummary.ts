import type { SaleFinanceEvent } from "../entity/SaleFinanceEvent"

export interface FinanceCurrencyBucket {
    currency: string
    revenue: number
    cogs: number
    margin: number
    count: number
}

export interface FinanceSummary {
    /** Totales sin convertir moneda (suma bruta; usar byCurrency para precisión). */
    revenue: number
    cogs: number
    margin: number
    count: number
    byCurrency: FinanceCurrencyBucket[]
}

/**
 * B4.2 — resumen solo a partir de sale_finance_event (escritos en VERIFIED).
 * No mezcla pedidos UNVERIFIED ni amount de Sale.
 */
export function aggregateFinanceSummary(
    events: readonly SaleFinanceEvent[]
): FinanceSummary {
    const map = new Map<string, FinanceCurrencyBucket>()
    let revenue = 0
    let cogs = 0
    let margin = 0

    for (const e of events) {
        const cur = (e.currency || "—").trim() || "—"
        const r = Number(e.revenue) || 0
        const c = Number(e.cogs) || 0
        const m = Number(e.margin) || 0
        revenue += r
        cogs += c
        margin += m
        const bucket = map.get(cur) ?? {
            currency: cur,
            revenue: 0,
            cogs: 0,
            margin: 0,
            count: 0,
        }
        bucket.revenue += r
        bucket.cogs += c
        bucket.margin += m
        bucket.count += 1
        map.set(cur, bucket)
    }

    const byCurrency = Array.from(map.values()).sort((a, b) =>
        a.currency.localeCompare(b.currency)
    )

    return {
        revenue,
        cogs,
        margin,
        count: events.length,
        byCurrency,
    }
}

export function emptyFinanceSummary(): FinanceSummary {
    return { revenue: 0, cogs: 0, margin: 0, count: 0, byCurrency: [] }
}

/** Rango ISO inclusivo para los últimos `days` días hasta ahora. */
export function financeRangeLastDays(days: number, nowMs: number = Date.now()): {
    fromIso: string
    toIso: string
} {
    const to = new Date(nowMs)
    const from = new Date(nowMs - Math.max(1, days) * 24 * 60 * 60 * 1000)
    return { fromIso: from.toISOString(), toIso: to.toISOString() }
}
