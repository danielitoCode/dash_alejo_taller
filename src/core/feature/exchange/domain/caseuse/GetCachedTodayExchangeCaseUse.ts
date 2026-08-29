import type { CupExchange } from "../entity/CupExchange"
import type { ExchangeRepository } from "../repository/ExchangeRepository"

export class GetCachedTodayExchangeCaseUse {
    constructor(private readonly repo: ExchangeRepository) {}

    async execute(): Promise<CupExchange | null> {
        return this.repo.getCachedToday()
    }
}
