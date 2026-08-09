import {derived, writable} from "svelte/store";
import type {Product} from "../../domain/entity/Product";
import {productContainer} from "../../di/product.container";

interface ProductState {
    items: Product[]
    selected: Product | null
    loading: boolean
    saving: boolean
    error: string | null
    page: number
    pageSize: number
    total: number
}

const initialState: ProductState = {
    items: [],
    selected: null,
    loading: false,
    saving: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0
}

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error"
}

function createProductStore() {
    const {subscribe, update} = writable<ProductState>(initialState)

    async function runLoading<T>(task: () => Promise<T>): Promise<T> {
        update((state) => ({...state, loading: true, error: null}))
        try {
            return await task()
        } catch (error) {
            update((state) => ({...state, error: normalizeError(error)}))
            throw error
        } finally {
            update((state) => ({...state, loading: false}))
        }
    }

    async function runSaving<T>(task: () => Promise<T>): Promise<T> {
        update((state) => ({...state, saving: true, error: null}))
        try {
            return await task()
        } catch (error) {
            update((state) => ({...state, error: normalizeError(error)}))
            throw error
        } finally {
            update((state) => ({...state, saving: false}))
        }
    }

    async function syncAll(): Promise<void> {
        await runLoading(async () => {
            let limit = 10
            let offset = 0
            update((state) => {
                limit = state.pageSize
                offset = (state.page - 1) * state.pageSize
                return state
            })
            const result = await productContainer.useCases.getAll.execute(limit, offset)
            update((state) => ({
                ...state,
                items: result.items,
                total: result.total
            }))
        })
    }

    async function setPage(page: number): Promise<void> {
        update((state) => ({...state, page}))
        await syncAll()
    }

    async function nextPage(): Promise<void> {
        let hasMore = false
        update((state) => {
            hasMore = state.page * state.pageSize < state.total
            return state
        })
        if (hasMore) {
            update((state) => ({...state, page: state.page + 1}))
            await syncAll()
        }
    }

    async function prevPage(): Promise<void> {
        let hasPrev = false
        update((state) => {
            hasPrev = state.page > 1
            return state
        })
        if (hasPrev) {
            update((state) => ({...state, page: state.page - 1}))
            await syncAll()
        }
    }

    async function syncById(id: string): Promise<Product | null> {
        return await runLoading(async () => {
            const product = await productContainer.useCases.getById.execute(id)
            update((state) => ({...state, selected: product}))
            return product
        })
    }

    async function create(data: Product): Promise<void> {
        await runSaving(async () => {
            await productContainer.useCases.create.execute(data)
            update((state) => ({...state, page: 1}))
            await syncAll()
        })
    }

    /** Edición de catálogo (2.2): valida existence >= reserved re-leído. */
    async function updateCatalog(product: Product): Promise<void> {
        await runSaving(async () => {
            await productContainer.useCases.updateCatalog.execute(product)
            await syncAll()
            const synced = await productContainer.useCases.getById.execute(product.id)
            update((state) => ({...state, selected: synced}))
        })
    }

    /** Compat: precio + resto de campos vía la misma validación 2.2. */
    async function updatePrice(product: Product, newPrice: number): Promise<void> {
        await runSaving(async () => {
            await productContainer.useCases.updatePrice.execute(newPrice, product)
            await syncAll()
            const synced = await productContainer.useCases.getById.execute(product.id)
            update((state) => ({...state, selected: synced}))
        })
    }

    async function removeById(id: string): Promise<void> {
        await runSaving(async () => {
            await productContainer.useCases.delete.execute(id)
            let newPage = 1
            update((state) => {
                const totalPages = Math.ceil((state.total - 1) / state.pageSize)
                newPage = state.page > totalPages ? Math.max(1, totalPages) : state.page
                return {...state, page: newPage}
            })
            await syncAll()
            update((state) => ({
                ...state,
                selected: state.selected?.id === id ? null : state.selected
            }))
        })
    }

    function clearError(): void {
        update((state) => ({...state, error: null}))
    }

    function reset(): void {
        update(() => initialState)
    }

    const hasData = derived({subscribe}, ($state) => $state.items.length > 0)

    return {
        subscribe,
        hasData,
        syncAll,
        setPage,
        nextPage,
        prevPage,
        syncById,
        create,
        updateCatalog,
        updatePrice,
        removeById,
        clearError,
        reset
    }
}

export const productStore = createProductStore()
