export type PromotionSource = "automatic" | "manual"

/** Política B: descuento de producto vs banner informativo. */
export type PromotionKind = "product_discount" | "banner"

export type PromotionStatus = "draft" | "active" | "ended" | "cancelled"

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
    /** Política B — si falta se infiere por productId */
    kind?: PromotionKind
    status?: PromotionStatus
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
