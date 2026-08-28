/**
 * Tasa de mercado (paridad AlejoTaller).
 * usdReference = CUP por 1 USD.
 * @see .policies/exchange/EXCHANGE_POLICY.md
 */
export type ExchangeRateSource = "DIRECTORIO_CUBANO" | "manual"

export interface CupExchange {
    id: string
    /** CUP por 1 USD */
    usdReference: number
    euroReference?: number
    updatedAt: string
    source: ExchangeRateSource
}

export function createCupExchange(input: CupExchange): CupExchange {
    const id = String(input.id || "").trim()
    if (!id) throw new Error("exchange id is required")
    const usdReference = Number(input.usdReference)
    if (!Number.isFinite(usdReference) || usdReference <= 0) {
        throw new Error("usdReference (CUP per 1 USD) must be > 0")
    }
    const euro =
        input.euroReference !== undefined && input.euroReference !== null
            ? Number(input.euroReference)
            : undefined
    if (euro !== undefined && (!Number.isFinite(euro) || euro <= 0)) {
        throw new Error("euroReference must be > 0 when provided")
    }
    const source: ExchangeRateSource =
        input.source === "manual" ? "manual" : "DIRECTORIO_CUBANO"
    return {
        id,
        usdReference,
        euroReference: euro,
        updatedAt: String(input.updatedAt || new Date().toISOString()),
        source,
    }
}

/** unitCostCUP / rate → USD (last_unit_cost). */
export function cupToUsd(unitCostCup: number, cupPerUsd: number): number {
    const cost = Number(unitCostCup)
    const rate = Number(cupPerUsd)
    if (!Number.isFinite(cost) || cost < 0) throw new Error("unitCostCup must be >= 0")
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("exchange rate must be > 0")
    return cost / rate
}
