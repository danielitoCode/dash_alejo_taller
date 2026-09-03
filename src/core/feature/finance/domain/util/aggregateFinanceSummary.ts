import type { SaleFinanceEvent } from "../entity/SaleFinanceEvent"

export interface FinanceCurrencyBucket {
    currency: string
    revenue: number
    cogs: number
    margin: number
    count: number
}

/**
 * Core 5 B1 — resumen de período solo a nivel documento.
 *
 * - Fuente: `SaleFinanceEvent` (escritos en VERIFIED; Core 4 snapshot).
 * - Totales `revenue` / `cogs` / `margin` son suma bruta **sin** convertir moneda;
 *   usar `byCurrency` para precisión multi-moneda.
 * - **No** lee `lines`: sin desglose por producto aquí (eso es B3 `aggregateByProduct`).
 * - Eventos legacy (Core 2, `lines` vacío o ausente) se agregan igual por totales de documento.
 */
export interface FinanceSummary {
    /** Totales sin convertir moneda (suma bruta; usar byCurrency para precisión). */
    revenue: number
    cogs: number
    margin: number
    count: number
    byCurrency: FinanceCurrencyBucket[]
}

/**
 * Core 5 B3 — bucket por producto desde `lines` (snapshot Core 4).
 * No relee `last_unit_cost` del catálogo; solo `lineRevenue` / `lineCogs` / `lineMargin`.
 */
export interface FinanceProductBucket {
    productId: string
    quantity: number
    lineRevenue: number
    lineCogs: number
    lineMargin: number
    /** Nº de eventos (ventas) que aportaron al menos una línea de este producto. */
    saleCount: number
}

/**
 * Agrega KPIs de período desde `sale_finance_event`.
 * Solo campos de documento; no inventa desglose producto si faltan `lines`.
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

/**
 * Core 5 B3 — desglose por `productId` sumando `lines` de los events.
 *
 * - Eventos sin `lines` (legacy) se ignoran para este desglose (no inventa filas).
 * - COGS/margen salen del snapshot en la línea; **prohibido** usar costo de catálogo aquí.
 * - Orden: `lineRevenue` desc, luego `productId`.
 */
export function aggregateByProduct(
    events: readonly SaleFinanceEvent[]
): FinanceProductBucket[] {
    const map = new Map<
        string,
        FinanceProductBucket & { _sales: Set<string> }
    >()

    for (const e of events) {
        const lines = Array.isArray(e.lines) ? e.lines : []
        if (lines.length === 0) continue

        const seenInEvent = new Set<string>()
        for (const line of lines) {
            const productId = String(line?.productId ?? "").trim()
            if (!productId) continue

            const qty = Math.trunc(Number(line.quantity)) || 0
            const lr = Number(line.lineRevenue) || 0
            const lc = Number(line.lineCogs) || 0
            const lm =
                Number.isFinite(Number(line.lineMargin))
                    ? Number(line.lineMargin)
                    : lr - lc

            let bucket = map.get(productId)
            if (!bucket) {
                bucket = {
                    productId,
                    quantity: 0,
                    lineRevenue: 0,
                    lineCogs: 0,
                    lineMargin: 0,
                    saleCount: 0,
                    _sales: new Set(),
                }
                map.set(productId, bucket)
            }
            bucket.quantity += qty > 0 ? qty : 0
            bucket.lineRevenue += lr
            bucket.lineCogs += lc
            bucket.lineMargin += lm
            if (!seenInEvent.has(productId)) {
                seenInEvent.add(productId)
                bucket._sales.add(e.saleId || e.id)
            }
        }
    }

    return Array.from(map.values())
        .map(({ _sales, ...rest }) => ({
            ...rest,
            saleCount: _sales.size,
        }))
        .sort((a, b) => {
            if (b.lineRevenue !== a.lineRevenue) return b.lineRevenue - a.lineRevenue
            return a.productId.localeCompare(b.productId)
        })
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
