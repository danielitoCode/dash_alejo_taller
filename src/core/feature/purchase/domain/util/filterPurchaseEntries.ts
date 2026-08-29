import type { PurchaseEntry } from "../entity/PurchaseEntry"

export type PurchaseEntryClientFilter = {
    /** Texto libre: id, reference, userId, notes */
    query?: string
    supplierId?: string
    userId?: string
    /** ISO date yyyy-mm-dd inclusive start of day local-ish (string compare on ISO). */
    dateFrom?: string
    dateTo?: string
}

/**
 * Filtros client-side sobre listado ya ordenado por entry_date desc.
 * dateFrom/dateTo comparan el prefijo de entryDateIso (YYYY-MM-DD).
 */
export function filterPurchaseEntries(
    entries: PurchaseEntry[],
    filter: PurchaseEntryClientFilter
): PurchaseEntry[] {
    const q = String(filter.query || "").trim().toLowerCase()
    const supplierId = String(filter.supplierId || "").trim()
    const userId = String(filter.userId || "").trim()
    const dateFrom = String(filter.dateFrom || "").trim()
    const dateTo = String(filter.dateTo || "").trim()

    return entries.filter((e) => {
        if (supplierId && String(e.supplierId || "") !== supplierId) return false
        if (userId && String(e.userId || "") !== userId) return false

        const day = String(e.entryDateIso || "").slice(0, 10)
        if (dateFrom && day < dateFrom) return false
        if (dateTo && day > dateTo) return false

        if (!q) return true
        const hay = [
            e.id,
            e.reference,
            e.userId,
            e.notes,
            e.supplierId,
            String(e.totalCost),
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        return hay.includes(q)
    })
}
