import { derived, writable } from "svelte/store"
import { purchaseContainer } from "../../di/purchase.container"
import type { CreateSupplierInput } from "../../domain/caseuse/CreateSupplierCaseUse"
import type { UpdateSupplierInput } from "../../domain/caseuse/UpdateSupplierCaseUse"
import type { Supplier } from "../../domain/entity/Supplier"

interface SupplierState {
    items: Supplier[]
    loading: boolean
    saving: boolean
    error: string | null
}

const initialState: SupplierState = {
    items: [],
    loading: false,
    saving: false,
    error: null,
}

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error"
}

function createSupplierStore() {
    const { subscribe, update } = writable<SupplierState>(initialState)

    async function runLoading<T>(task: () => Promise<T>): Promise<T> {
        update((s) => ({ ...s, loading: true, error: null }))
        try {
            return await task()
        } catch (error) {
            update((s) => ({ ...s, error: normalizeError(error) }))
            throw error
        } finally {
            update((s) => ({ ...s, loading: false }))
        }
    }

    async function runSaving<T>(task: () => Promise<T>): Promise<T> {
        update((s) => ({ ...s, saving: true, error: null }))
        try {
            return await task()
        } catch (error) {
            update((s) => ({ ...s, error: normalizeError(error) }))
            throw error
        } finally {
            update((s) => ({ ...s, saving: false }))
        }
    }

    async function syncAll(limit = 100): Promise<void> {
        await runLoading(async () => {
            const items = await purchaseContainer.useCases.listSuppliers.execute(limit)
            update((s) => ({ ...s, items }))
        })
    }

    async function create(input: CreateSupplierInput): Promise<Supplier> {
        return runSaving(async () => {
            const created = await purchaseContainer.useCases.createSupplier.execute(input)
            await syncAll()
            return created
        })
    }

    async function updateById(id: string, patch: UpdateSupplierInput): Promise<Supplier> {
        return runSaving(async () => {
            const updated = await purchaseContainer.useCases.updateSupplier.execute(id, patch)
            await syncAll()
            return updated
        })
    }

    function clearError(): void {
        update((s) => ({ ...s, error: null }))
    }

    const hasData = derived({ subscribe }, ($s) => $s.items.length > 0)

    return {
        subscribe,
        hasData,
        syncAll,
        create,
        updateById,
        clearError,
    }
}

export const supplierStore = createSupplierStore()
