import type { Sale } from "../../domain/entity/Sale"
import type { SaleDTO } from "../../data/dto/SaleDTO"
import { derived, writable } from "svelte/store"
import { saleContainer } from "../../di/sale.container"
import { productStore } from "../../../product/presentation/viewmodel/product.store"
import { financeStore } from "../../../finance/presentation/viewmodel/finance.store"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"
import { SaleOfflineFirstRepository } from "../../data/repository/sale.offline-first.repository"

interface SaleState {
    items: Sale[]
    loading: boolean
    error: string | null
}

const initialState: SaleState = {
    items: [],
    loading: false,
    error: null,
}

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error"
}

function productIdsFromSale(sale: Sale | null | undefined): string[] {
    if (!sale?.products?.length) return []
    return sale.products.map((p) => p.productId).filter(Boolean)
}

function sortNewestFirst(items: Sale[]): Sale[] {
    return [...items].sort((a, b) => {
        const ca = String(a.createdAtIso || a.date || "")
        const cb = String(b.createdAtIso || b.date || "")
        return cb.localeCompare(ca)
    })
}

function createSaleStore() {
    const { subscribe, update } = writable<SaleState>(initialState)
    let snapshot: SaleState = initialState
    subscribe((s) => (snapshot = s))

    function offlineRepo(): SaleOfflineFirstRepository | null {
        const r = saleContainer.repositories?.offlineFirst
        return r instanceof SaleOfflineFirstRepository ? r : null
    }

    async function syncAll(): Promise<void> {
        logger.info("Sync sales from storage")
        update((state) => ({ ...state, loading: true, error: null }))
        try {
            const sales = await saleContainer.useCases.getAll.execute()
            const sorted = sortNewestFirst(sales)
            logger.log({
                scope: "sale.store.syncAll",
                count: sorted.length,
                firstSaleId: sorted[0]?.id ?? null,
            })
            update((state) => ({ ...state, items: sorted }))
        } catch (error) {
            logger.error({
                scope: "sale.store.syncAll",
                message: error instanceof Error ? error.message : String(error),
            })
            update((state) => ({ ...state, error: normalizeError(error) }))
            throw error
        } finally {
            update((state) => ({ ...state, loading: false }))
        }
    }

    /**
     * Aplica un documento sale crudo de Appwrite Realtime (create/update).
     * Actualiza Dexie + store sin listDocuments completo.
     */
    async function applyRealtimeSale(dto: SaleDTO): Promise<void> {
        const repo = offlineRepo()
        try {
            let sale: Sale
            if (repo) {
                sale = await repo.applyRemoteDocument(dto)
            } else {
                // fallback: full sync
                await syncAll()
                return
            }
            update((state) => {
                const without = state.items.filter((s) => s.id !== sale.id)
                return { ...state, items: sortNewestFirst([sale, ...without]) }
            })
            logger.log({ scope: "sale.store.applyRealtimeSale", id: sale.id })
        } catch (e) {
            logger.warn(`[sale.store] realtime apply failed, full sync: ${e}`)
            await syncAll().catch(() => undefined)
        }
    }

    async function removeRealtimeSale(id: string): Promise<void> {
        const sid = String(id || "").trim()
        if (!sid) return
        const repo = offlineRepo()
        try {
            if (repo) await repo.removeRemoteDocument(sid)
            update((state) => ({
                ...state,
                items: state.items.filter((s) => s.id !== sid),
            }))
        } catch (e) {
            logger.warn(`[sale.store] realtime remove failed: ${e}`)
            await syncAll().catch(() => undefined)
        }
    }

    /** @deprecated Core1 5.x */
    async function setVerified(id: string, verified: string): Promise<void> {
        update((state) => ({ ...state, loading: true, error: null }))
        try {
            const updated = await saleContainer.useCases.updateVerified.execute(id, verified as any)
            update((state) => ({
                ...state,
                items: state.items.map((s) => (s.id === id ? updated : s)),
            }))
        } catch (error) {
            update((state) => ({ ...state, error: normalizeError(error) }))
            throw error
        } finally {
            update((state) => ({ ...state, loading: false }))
        }
    }

    async function confirmSale(id: string): Promise<Sale> {
        update((state) => ({ ...state, loading: true, error: null }))
        try {
            const snapshotSale = snapshot.items.find((s) => s.id === id) ?? null
            const updated = await saleContainer.useCases.confirmFromPanel.execute(id, snapshotSale)
            void financeStore.loadSummary().catch((e) =>
                logger.warn(`[sale.store] finance refresh after confirm: ${e}`)
            )
            update((state) => ({
                ...state,
                items: state.items.map((s) => (s.id === id ? updated : s)),
            }))
            await productStore
                .refreshStockForProducts(productIdsFromSale(snapshotSale ?? updated))
                .catch((e) => logger.warn(`[sale.store][6.4] refresh after confirm: ${e}`))
            return updated
        } catch (error: any) {
            logger.error(error?.message ?? error, error?.stack)
            update((state) => ({ ...state, error: normalizeError(error) }))
            throw error
        } finally {
            update((state) => ({ ...state, loading: false }))
        }
    }

    async function rejectSale(id: string): Promise<Sale> {
        update((state) => ({ ...state, loading: true, error: null }))
        try {
            const snapshotSale = snapshot.items.find((s) => s.id === id) ?? null
            const updated = await saleContainer.useCases.rejectFromPanel.execute(id, snapshotSale)
            update((state) => ({
                ...state,
                items: state.items.map((s) => (s.id === id ? updated : s)),
            }))
            await productStore
                .refreshStockForProducts(productIdsFromSale(snapshotSale ?? updated))
                .catch((e) => logger.warn(`[sale.store][6.4] refresh after reject: ${e}`))
            return updated
        } catch (error: any) {
            logger.error(error?.message ?? error, error?.stack)
            update((state) => ({ ...state, error: normalizeError(error) }))
            throw error
        } finally {
            update((state) => ({ ...state, loading: false }))
        }
    }

    function clearError(): void {
        update((state) => ({ ...state, error: null }))
    }

    function reset(): void {
        update(() => initialState)
    }

    const hasData = derived({ subscribe }, ($state) => $state.items.length > 0)

    return {
        subscribe,
        hasData,
        syncAll,
        applyRealtimeSale,
        removeRealtimeSale,
        setVerified,
        confirmSale,
        rejectSale,
        clearError,
        reset,
    }
}

export const saleStore = createSaleStore()
