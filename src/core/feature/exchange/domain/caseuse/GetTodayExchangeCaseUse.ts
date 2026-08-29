import type { CupExchange } from "../entity/CupExchange"
import type { ExchangeRepository } from "../repository/ExchangeRepository"

/** Actualiza tasa del día desde API (usa cache al fallar red si hay del día). */
export class GetTodayExchangeCaseUse {
    constructor(private readonly repo: ExchangeRepository) {}

    async execute(): Promise<CupExchange> {
        try {
            return await this.repo.getToday()
        } catch (err) {
            const cached = await this.repo.getCachedToday()
            if (cached) return cached
            throw err
        }
    }
}
