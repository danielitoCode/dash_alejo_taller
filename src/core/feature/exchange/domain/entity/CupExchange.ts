/**
 * Tasa de mercado (paridad AlejoTaller).
 * usdReference = CUP por 1 USD.
 * @see .policies/exchange/EXCHANGE_POLICY.md
 */
export type ExchangeRateSource = "DIRECTORIO_CUBANO" | "manual"

/** Markup de protección de precio de venta (anti-pérdida). */
export const PRICE_PROTECTION_MARKUP = 1.3

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

/**
 * ¿El costo unitario USD supera el precio de venta actual?
 * Solo aplica a líneas purchase con unitCostUsd > 0 (política §5).
 */
export function needsPriceProtection(unitCostUsd: number, currentPrice: number): boolean {
    const cost = Number(unitCostUsd)
    const price = Number(currentPrice)
    if (!Number.isFinite(cost) || cost <= 0) return false
    if (!Number.isFinite(price) || price < 0) return false
    return cost > price
}

/** Precio de venta protegido = unitCostUSD × 1.30 */
export function protectedSalePrice(unitCostUsd: number): number {
    const cost = Number(unitCostUsd)
    if (!Number.isFinite(cost) || cost < 0) {
        throw new Error("unitCostUsd must be >= 0")
    }
    return cost * PRICE_PROTECTION_MARKUP
}

export type PriceProtectionDecision = {
    applied: boolean
    previousPrice: number
    newPrice: number
    unitCostUsd: number
}

/**
 * Decisión pura de protección de precio (preview UI + case use).
 * Solo sube precio; nunca baja.
 */
export function decidePriceProtection(
    unitCostUsd: number,
    currentPrice: number
): PriceProtectionDecision {
    const cost = Number(unitCostUsd)
    const price = Number(currentPrice)
    const safePrice = Number.isFinite(price) && price >= 0 ? price : 0
    const safeCost = Number.isFinite(cost) && cost >= 0 ? cost : 0

    if (!needsPriceProtection(safeCost, safePrice)) {
        return {
            applied: false,
            previousPrice: safePrice,
            newPrice: safePrice,
            unitCostUsd: safeCost,
        }
    }

    const next = protectedSalePrice(safeCost)
    return {
        applied: true,
        previousPrice: safePrice,
        newPrice: next,
        unitCostUsd: safeCost,
    }
}
