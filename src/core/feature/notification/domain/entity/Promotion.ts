export type PromotionSource = "automatic" | "manual"

export interface Promotion {
    id: string
    productId?: string | null
    title: string
    message: string
    imageUrl?: string | null
    oldPrice?: number | null
    currentPrice?: number | null
    validFromEpochMillis: number
    validUntilEpochMillis: number
    source?: PromotionSource
}

export function isPromotionActive(
    promotion: Promotion,
    nowEpochMillis: number
): boolean {
    return (
        nowEpochMillis >= promotion.validFromEpochMillis &&
        nowEpochMillis <= promotion.validUntilEpochMillis
    )
}
