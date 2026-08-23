import type { Sale } from "../entity/Sale"
import { BuyState } from "../entity/enums"
import type { SaleStatusFilter } from "./filterSalesByStatus"

/**
 * Timestamp de creación del pedido (ms). Preferir createdAtIso; fallback a date.
 */
export function saleCreatedAtMs(sale: Sale): number {
    const raw = sale.createdAtIso || sale.date || ""
    const t = Date.parse(raw)
    return Number.isFinite(t) ? t : 0
}

/**
 * B4.1 — cola UNVERIFIED por antigüedad (más antiguas primero).
 * Otros estados: más recientes primero (historial operativo).
 */
export function sortSalesForQueue(
    sales: readonly Sale[],
    statusFilter: SaleStatusFilter
): Sale[] {
    const copy = [...sales]
    if (statusFilter === BuyState.UNVERIFIED) {
        copy.sort((a, b) => saleCreatedAtMs(a) - saleCreatedAtMs(b))
    } else {
        copy.sort((a, b) => saleCreatedAtMs(b) - saleCreatedAtMs(a))
    }
    return copy
}

export type SaleAgeUrgency = "fresh" | "warn" | "critical"

/** Umbrales orientativos para supervisión de cola (horas). */
export function saleAgeUrgency(ageHours: number): SaleAgeUrgency {
    if (ageHours >= 48) return "critical"
    if (ageHours >= 12) return "warn"
    return "fresh"
}

export function saleAgeHours(sale: Sale, nowMs: number = Date.now()): number {
    const created = saleCreatedAtMs(sale)
    if (created <= 0) return 0
    return Math.max(0, (nowMs - created) / (1000 * 60 * 60))
}

/**
 * Etiqueta relativa en español: "hace 15 min", "hace 3 h", "hace 2 d".
 */
export function formatSaleAge(sale: Sale, nowMs: number = Date.now()): string {
    const created = saleCreatedAtMs(sale)
    if (created <= 0) return "sin fecha"
    const mins = Math.floor((nowMs - created) / (1000 * 60))
    if (mins < 1) return "hace un momento"
    if (mins < 60) return `hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 48) return `hace ${hours} h`
    const days = Math.floor(hours / 24)
    return `hace ${days} d`
}
