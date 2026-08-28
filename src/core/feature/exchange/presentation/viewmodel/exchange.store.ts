import { derived, writable } from "svelte/store"
import type { CupExchange } from "../../domain/entity/CupExchange"
import { exchangeContainer } from "../../di/exchange.container"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"

interface ExchangeState {
    exchange: CupExchange | null
    loading: boolean
    error: string | null
    lastRefreshAt: string | null
}

const initial: ExchangeState = {
    exchange: null,
    loading: false,
    error: null,
    lastRefreshAt: null,
}

function createExchangeStore() {
    const { subscribe, update, set } = writable<ExchangeState>(initial)

    /** Tras login / splash: refresca tasa API (best-effort). */
    async function refreshOnSession(): Promise<CupExchange | null> {
        update((s) => ({ ...s, loading: true, error: null }))
        try {
            const exchange = await exchangeContainer.useCases.getToday.execute()
            update((s) => ({
                ...s,
                exchange,
                loading: false,
                lastRefreshAt: new Date().toISOString(),
                error: null,
            }))
            logger.info(
                `[Exchange] tasa actualizada USD→CUP=${exchange.usdReference} source=${exchange.source}`
            )
            return exchange
        } catch (e) {
            const msg = e instanceof Error ? e.message : "No se pudo obtener la tasa"
            const cached = await exchangeContainer.useCases.getCachedToday.execute()
            update((s) => ({
                ...s,
                exchange: cached,
                loading: false,
                error: msg,
            }))
            logger.warn(`[Exchange] refresh falló: ${msg}`)
            return cached
        }
    }

    async function loadCached(): Promise<void> {
        const cached = await exchangeContainer.useCases.getCachedToday.execute()
        if (cached) {
            update((s) => ({ ...s, exchange: cached }))
        }
    }

    function reset(): void {
        set(initial)
    }

    const usdCupRate = derived({ subscribe }, ($s) => $s.exchange?.usdReference ?? null)

    return {
        subscribe,
        usdCupRate,
        refreshOnSession,
        loadCached,
        reset,
    }
}

export const exchangeStore = createExchangeStore()
