import type { CupExchange } from "../../domain/entity/CupExchange"
import type { ExchangeRepository } from "../../domain/repository/ExchangeRepository"
import { toDomain } from "../mapper/Mappers"
import type { ExchangeNetRepository } from "./exchange.net.repository"

const CACHE_KEY = "dash_exchange_today_v1"

function todayKey(): string {
    return new Date().toISOString().slice(0, 10)
}

function readCache(): CupExchange | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as CupExchange & { _day?: string }
        if (parsed._day !== todayKey()) return null
        if (!parsed.usdReference || parsed.usdReference <= 0) return null
        return {
            id: parsed.id,
            usdReference: Number(parsed.usdReference),
            euroReference: parsed.euroReference,
            updatedAt: parsed.updatedAt,
            source: parsed.source === "manual" ? "manual" : "DIRECTORIO_CUBANO",
        }
    } catch {
        return null
    }
}

function writeCache(exchange: CupExchange): void {
    try {
        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ...exchange, _day: todayKey() })
        )
    } catch {
        /* ignore quota */
    }
}

export class ExchangeOfflineFirstRepository implements ExchangeRepository {
    constructor(private readonly net: ExchangeNetRepository) {}

    async getCachedToday(): Promise<CupExchange | null> {
        return readCache()
    }

    async getToday(): Promise<CupExchange> {
        const dto = await this.net.getExchangeToday()
        const domain = toDomain(dto)
        writeCache(domain)
        return domain
    }
}
