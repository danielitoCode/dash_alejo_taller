import { writable } from "svelte/store"
import { purchaseContainer } from "../../di/purchase.container"
import type { PurchaseEntry } from "../../domain/entity/PurchaseEntry"
import type { PurchaseEntryDetail } from "../../domain/caseuse/GetPurchaseEntryDetailCaseUse"
import type { CancelPurchaseEntryResult } from "../../domain/caseuse/CancelPurchaseEntryCaseUse"

interface HistoryState {
    items: PurchaseEntry[]
    detail: PurchaseEntryDetail | null
    loading: boolean
    detailLoading: boolean
    /** Core 3 B3.1 — anulación de entrada en curso. */
    cancelling: boolean
    error: string | null
}

const initial: HistoryState = {
    items: [],
    detail: null,
    loading: false,
    detailLoading: false,
    cancelling: false,
    error: null,
}

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error"
}

function createPurchaseHistoryStore() {
    const { subscribe, update, set } = writable<HistoryState>(initial)

    async function syncList(limit = 80, supplierId?: string): Promise<void> {
        update((s) => ({ ...s, loading: true, error: null }))
        try {
            const items = await purchaseContainer.useCases.listPurchaseEntries.execute({
                limit,
                supplierId: supplierId || undefined,
            })
            update((s) => ({ ...s, items, loading: false }))
        } catch (error) {
            update((s) => ({ ...s, loading: false, error: normalizeError(error) }))
            throw error
        }
    }

    async function loadDetail(entryId: string): Promise<PurchaseEntryDetail> {
        update((s) => ({ ...s, detailLoading: true, error: null }))
        try {
            const detail = await purchaseContainer.useCases.getPurchaseEntryDetail.execute(entryId)
            update((s) => ({ ...s, detail, detailLoading: false }))
            return detail
        } catch (error) {
            update((s) => ({ ...s, detailLoading: false, error: normalizeError(error), detail: null }))
            throw error
        }
    }

    function clearDetail(): void {
        update((s) => ({ ...s, detail: null }))
    }

    /**
     * Core 3 B3.1 — anula una entrada (compensación de stock, sin tocar
     * reserved/lastUnitCost) y refresca detalle + listado en memoria.
     * La UI es responsable de confirmar y de gatear por rol owner/admin.
     */
    async function cancelEntry(entryId: string): Promise<CancelPurchaseEntryResult> {
        update((s) => ({ ...s, cancelling: true, error: null }))
        try {
            const result = await purchaseContainer.useCases.cancelPurchaseEntry.execute(entryId)

            const refreshedDetail = await purchaseContainer.useCases.getPurchaseEntryDetail.execute(
                entryId
            )

            update((s) => ({
                ...s,
                cancelling: false,
                detail: refreshedDetail,
                items: s.items.map((item) =>
                    item.id === entryId ? { ...item, status: "CANCELLED" } : item
                ),
            }))

            return result
        } catch (error) {
            update((s) => ({ ...s, cancelling: false, error: normalizeError(error) }))
            throw error
        }
    }

    function clearError(): void {
        update((s) => ({ ...s, error: null }))
    }

    function reset(): void {
        set(initial)
    }

    return {
        subscribe,
        syncList,
        loadDetail,
        clearDetail,
        cancelEntry,
        clearError,
        reset,
    }
}

export const purchaseHistoryStore = createPurchaseHistoryStore()
