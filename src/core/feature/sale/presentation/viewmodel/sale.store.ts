import type { Sale } from "../../domain/entity/Sale";
import { derived, writable } from "svelte/store";
import { saleContainer } from "../../di/sale.container";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

interface SaleState {
    items: Sale[];
    loading: boolean;
    error: string | null;
}

const initialState: SaleState = {
    items: [],
    loading: false,
    error: null,
};

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error";
}

function createSaleStore() {
    const { subscribe, update } = writable<SaleState>(initialState);
    let snapshot: SaleState = initialState;
    subscribe((s) => (snapshot = s));

    async function syncAll(): Promise<void> {
        logger.info("Sync sales from storage");
        update((state) => ({ ...state, loading: true, error: null }));
        try {
            const sales = await saleContainer.useCases.getAll.execute();
            logger.log({
                scope: "sale.store.syncAll",
                count: sales.length,
                firstSaleId: sales[0]?.id ?? null,
            });
            update((state) => ({ ...state, items: sales }));
        } catch (error) {
            logger.error({
                scope: "sale.store.syncAll",
                message: error instanceof Error ? error.message : String(error),
            });
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, loading: false }));
        }
    }

    /**
     * @deprecated Core1 5.x: usar confirmSale / rejectSale (aplican stock).
     */
    async function setVerified(id: string, verified: string): Promise<void> {
        update((state) => ({ ...state, loading: true, error: null }));
        try {
            const updated = await saleContainer.useCases.updateVerified.execute(id, verified);
            update((state) => ({
                ...state,
                items: state.items.map((s) => (s.id === id ? updated : s)),
            }));
        } catch (error: any) {
            logger.error(error?.message ?? error, error?.stack);
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, loading: false }));
        }
    }

    /** Core1 5.1 — confirm con stock = operador. */
    async function confirmSale(id: string): Promise<Sale> {
        update((state) => ({ ...state, loading: true, error: null }));
        try {
            const snapshotSale = snapshot.items.find((s) => s.id === id) ?? null;
            const updated = await saleContainer.useCases.confirmFromPanel.execute(id, snapshotSale);
            update((state) => ({
                ...state,
                items: state.items.map((s) => (s.id === id ? updated : s)),
            }));
            return updated;
        } catch (error: any) {
            logger.error(error?.message ?? error, error?.stack);
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, loading: false }));
        }
    }

    /** Core1 5.2 — reject: solo libera reserved. */
    async function rejectSale(id: string): Promise<Sale> {
        update((state) => ({ ...state, loading: true, error: null }));
        try {
            const snapshotSale = snapshot.items.find((s) => s.id === id) ?? null;
            const updated = await saleContainer.useCases.rejectFromPanel.execute(id, snapshotSale);
            update((state) => ({
                ...state,
                items: state.items.map((s) => (s.id === id ? updated : s)),
            }));
            return updated;
        } catch (error: any) {
            logger.error(error?.message ?? error, error?.stack);
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, loading: false }));
        }
    }

    function clearError(): void {
        update((state) => ({ ...state, error: null }));
    }

    function reset(): void {
        update(() => initialState);
    }

    const hasData = derived({ subscribe }, ($state) => $state.items.length > 0);

    return {
        subscribe,
        hasData,
        syncAll,
        setVerified,
        confirmSale,
        rejectSale,
        clearError,
        reset,
    };
}

export const saleStore = createSaleStore();
