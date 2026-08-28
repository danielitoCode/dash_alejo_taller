import type { CupExchange } from "../entity/CupExchange"

export interface ExchangeRepository {
    /** Fetch de red + cache local del día. */
    getToday(): Promise<CupExchange>
    /** Solo cache (sin red). null si no hay tasa del día. */
    getCachedToday(): Promise<CupExchange | null>
}
