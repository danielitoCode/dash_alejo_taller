/**
 * Core 4 B4 — candidatos de reconcile.
 * Solo sale_ids VERIFIED que aún no tienen sale_finance_event.
 * Nunca implica sobrescribir un event existente.
 */
export function salesMissingFinanceEvent(
    verifiedSaleIds: readonly string[],
    existingFinanceSaleIds: ReadonlySet<string>
): string[] {
    const out: string[] = []
    for (const id of verifiedSaleIds) {
        const saleId = String(id || "").trim()
        if (!saleId) continue
        if (existingFinanceSaleIds.has(saleId)) continue
        out.push(saleId)
    }
    return out
}
