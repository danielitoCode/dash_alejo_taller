import { derived, writable } from "svelte/store";
import type { Product } from "../../domain/entity/Product";
import { productContainer } from "../../di/product.container";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

interface ProductState {
    items: Product[];
    selected: Product | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
}

const initialState: ProductState = {
    items: [],
    selected: null,
    loading: false,
    saving: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
};

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error";
}

function createProductStore() {
    const { subscribe, update } = writable<ProductState>(initialState);

    async function runLoading<T>(task: () => Promise<T>): Promise<T> {
        update((state) => ({ ...state, loading: true, error: null }));
        try {
            return await task();
        } catch (error) {
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, loading: false }));
        }
    }

    async function runSaving<T>(task: () => Promise<T>): Promise<T> {
        update((state) => ({ ...state, saving: true, error: null }));
        try {
            return await task();
        } catch (error) {
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, saving: false }));
        }
    }

    async function syncAll(): Promise<void> {
        await runLoading(async () => {
            let limit = 10;
            let offset = 0;
            update((state) => {
                limit = state.pageSize;
                offset = (state.page - 1) * state.pageSize;
                return state;
            });
            const result = await productContainer.useCases.getAll.execute(limit, offset);
            update((state) => ({
                ...state,
                items: result.items,
                total: result.total,
            }));
        });
    }

    async function refreshStockForProducts(productIds: string[]): Promise<void> {
        const unique = [...new Set(productIds.map((id) => String(id || "").trim()).filter(Boolean))];
        if (unique.length === 0) return;

        logger.info(`[product.store][6.4] refreshStockForProducts count=${unique.length}`);

        for (const id of unique) {
            try {
                const product = await productContainer.useCases.getById.execute(id);
                if (!product) continue;
                update((state) => ({
                    ...state,
                    items: state.items.map((item) => (item.id === id ? product : item)),
                    selected: state.selected?.id === id ? product : product,
                }));
            } catch (e: any) {
                logger.warn(
                    `[product.store][6.4] refresh failed id=${id}: ${e?.message ?? e}`
                );
            }
        }
    }

    function patchLocalStock(
        productId: string,
        stock: { existence: number; reserved: number }
    ): void {
        const id = String(productId || "").trim();
        if (!id) return;
        update((state) => {
            const apply = (p: Product): Product =>
                p.id === id
                    ? {
                          ...p,
                          existence: stock.existence,
                          reserved: stock.reserved,
                      }
                    : p;
            return {
                ...state,
                items: state.items.map(apply),
                selected: state.selected ? apply(state.selected) : null,
            };
        });
        logger.info(
            `[product.store][6.4] patchLocalStock id=${id} existence=${stock.existence} reserved=${stock.reserved}`
        );
    }

    async function setPage(page: number): Promise<void> {
        update((state) => ({ ...state, page }));
        await syncAll();
    }

    async function nextPage(): Promise<void> {
        let hasMore = false;
        update((state) => {
            hasMore = state.page * state.pageSize < state.total;
            return state;
        });
        if (hasMore) {
            update((state) => ({ ...state, page: state.page + 1 }));
            await syncAll();
        }
    }

    async function prevPage(): Promise<void> {
        let hasPrev = false;
        update((state) => {
            hasPrev = state.page > 1;
            return state;
        });
        if (hasPrev) {
            update((state) => ({ ...state, page: state.page - 1 }));
            await syncAll();
        }
    }

    async function syncById(id: string): Promise<Product | null> {
        return await runLoading(async () => {
            const product = await productContainer.useCases.getById.execute(id);
            update((state) => ({ ...state, selected: product }));
            return product;
        });
    }

    async function create(data: Product): Promise<void> {
        await runSaving(async () => {
            await productContainer.useCases.create.execute(data);
            update((state) => ({ ...state, page: 1 }));
            await syncAll();
        });
    }

    async function updateCatalog(product: Product): Promise<void> {
        await runSaving(async () => {
            await productContainer.useCases.updateCatalog.execute(product);
            await syncAll();
            const synced = await productContainer.useCases.getById.execute(product.id);
            update((state) => ({ ...state, selected: synced }));
        });
    }

    async function registerStockEntry(productId: string, quantity: number): Promise<Product> {
        return await runSaving(async () => {
            const updated = await productContainer.useCases.registerStockEntry.execute(
                productId,
                quantity
            );
            update((state) => ({
                ...state,
                items: state.items.map((item) => (item.id === updated.id ? updated : item)),
                selected: state.selected?.id === updated.id ? updated : state.selected,
            }));
            try {
                const { publishStockChanged } = await import(
                    "../../../../infrastructure/data/alset-pulse/stock-pulse"
                );
                await publishStockChanged({
                    productIds: [updated.id],
                    reason: "entry",
                    timestamp: new Date().toISOString(),
                });
            } catch (e: any) {
                logger.warn(`[product.store] publish stock:changed: ${e?.message ?? e}`);
            }
            return updated;
        });
    }

    async function registerStockAdjustment(
        productId: string,
        delta: number,
        reason: string
    ): Promise<Product> {
        return await runSaving(async () => {
            const updated = await productContainer.useCases.registerStockAdjustment.execute({
                productId,
                delta,
                reason,
            });
            update((state) => ({
                ...state,
                items: state.items.map((item) => (item.id === updated.id ? updated : item)),
                selected: state.selected?.id === updated.id ? updated : state.selected,
            }));
            try {
                const { publishStockChanged } = await import(
                    "../../../../infrastructure/data/alset-pulse/stock-pulse"
                );
                await publishStockChanged({
                    productIds: [updated.id],
                    reason: "adjustment",
                    timestamp: new Date().toISOString(),
                });
            } catch (e: any) {
                logger.warn(`[product.store] publish stock:changed: ${e?.message ?? e}`);
            }
            return updated;
        });
    }

    async function handleStockChanged(productIds: string[]): Promise<void> {
        await refreshStockForProducts(productIds);
    }

    async function updatePrice(product: Product, newPrice: number): Promise<void> {
        await runSaving(async () => {
            await productContainer.useCases.updatePrice.execute(newPrice, product);
            await syncAll();
            const synced = await productContainer.useCases.getById.execute(product.id);
            update((state) => ({ ...state, selected: synced }));
        });
    }

    async function removeById(id: string): Promise<void> {
        await runSaving(async () => {
            await productContainer.useCases.delete.execute(id);
            let newPage = 1;
            update((state) => {
                const totalPages = Math.ceil((state.total - 1) / state.pageSize);
                newPage = state.page > totalPages ? Math.max(1, totalPages) : state.page;
                return { ...state, page: newPage };
            });
            await syncAll();
            update((state) => ({
                ...state,
                selected: state.selected?.id === id ? null : state.selected,
            }));
        });
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
        refreshStockForProducts,
        patchLocalStock,
        setPage,
        nextPage,
        prevPage,
        syncById,
        create,
        updateCatalog,
        registerStockEntry,
        registerStockAdjustment,
        handleStockChanged,
        updatePrice,
        removeById,
        clearError,
        reset,
    };
}

export const productStore = createProductStore();
