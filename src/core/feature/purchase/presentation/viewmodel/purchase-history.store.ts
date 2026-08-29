import { writable } from "svelte/store"
import { purchaseContainer } from "../../di/purchase.container"
import type { PurchaseEntry } from "../../domain/entity/PurchaseEntry"
import type { PurchaseEntryDetail } from "../../domain/caseuse/GetPurchaseEntryDetailCaseUse"

interface HistoryState {
    items: PurchaseEntry[]
    detail: PurchaseEntryDetail | null
    loading: boolean
    detailLoading: boolean
    error: string | null
}

const initial: HistoryState = {
    items: [],
    detail: null,
    loading: false,
    detailLoading: false,
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
        clearError,
        reset,
    }
}

export const purchaseHistoryStore = createPurchaseHistoryStore()
