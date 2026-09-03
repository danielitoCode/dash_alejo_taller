import type { Sale } from "../entity/Sale"
import { BuyState } from "../entity/enums"
import {
    saleAgeHours,
    saleAgeUrgency,
    saleCreatedAtMs,
    sortSalesForQueue,
    type SaleAgeUrgency,
} from "./sortSalesByAge"

/**
 * Core 5 B4 — supervisión operativa (fuente: Sale, no sale_finance_event).
 * Separado de KPIs financieros: aquí cuentan estados de cola y resolución.
 */

export interface SaleOpsAgingBuckets {
    fresh: number
    warn: number
    critical: number
}

export interface SaleOpsSummary {
    /** Cola viva: todos los UNVERIFIED abiertos (sin filtrar por período). */
    unverifiedOpen: number
    aging: SaleOpsAgingBuckets
    /** Resoluciones en el período (por createdAt o updatedAt si existe). */
    verifiedInPeriod: number
    deletedInPeriod: number
    /** Pedidos creados en el período (cualquier estado). */
    createdInPeriod: number
    periodDays: number
}

export function saleActivityMs(sale: Sale): number {
    const raw = sale.updatedAtIso || sale.createdAtIso || sale.date || ""
    const t = Date.parse(raw)
    return Number.isFinite(t) ? t : saleCreatedAtMs(sale)
}

function inPeriod(ms: number, fromMs: number, toMs: number): boolean {
    if (ms <= 0) return false
    return ms >= fromMs && ms <= toMs
}

/**
 * Agrega métricas operativas de ventas.
 * - Cola / aging: todos los UNVERIFIED actuales.
 * - verified/deleted InPeriod: ventas en ese estado cuya actividad cae en el rango.
 */
export function aggregateSaleOperations(
    sales: readonly Sale[],
    opts: { periodDays: number; nowMs?: number }
): SaleOpsSummary {
    const nowMs = opts.nowMs ?? Date.now()
    const days = Math.max(1, Math.trunc(Number(opts.periodDays) || 30))
    const fromMs = nowMs - days * 24 * 60 * 60 * 1000

    const aging: SaleOpsAgingBuckets = { fresh: 0, warn: 0, critical: 0 }
    let unverifiedOpen = 0
    let verifiedInPeriod = 0
    let deletedInPeriod = 0
    let createdInPeriod = 0

    for (const s of sales) {
        const created = saleCreatedAtMs(s)
        if (inPeriod(created, fromMs, nowMs)) createdInPeriod++

        if (s.verified === BuyState.UNVERIFIED) {
            unverifiedOpen++
            const u = saleAgeUrgency(saleAgeHours(s, nowMs))
            aging[u]++
            continue
        }

        const activity = saleActivityMs(s)
        if (!inPeriod(activity, fromMs, nowMs)) continue
        if (s.verified === BuyState.VERIFIED) verifiedInPeriod++
        else if (s.verified === BuyState.DELETED) deletedInPeriod++
    }

    return {
        unverifiedOpen,
        aging,
        verifiedInPeriod,
        deletedInPeriod,
        createdInPeriod,
        periodDays: days,
    }
}

/** Cola UNVERIFIED ordenada (más antiguas primero), tope `limit` (default 7 en dashboard). */
export function pendingQueuePreview(
    sales: readonly Sale[],
    limit: number = 7,
    nowMs: number = Date.now()
): Sale[] {
    void nowMs
    const pending = sales.filter((s) => s.verified === BuyState.UNVERIFIED)
    const sorted = sortSalesForQueue(pending, BuyState.UNVERIFIED)
    return sorted.slice(0, Math.max(0, limit))
}

export type { SaleAgeUrgency }
