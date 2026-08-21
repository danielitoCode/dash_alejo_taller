/** Concepto de línea de entrada (Core 2). */
export type PurchaseLineConcept = "purchase" | "royalty" | "other"

export const PURCHASE_LINE_CONCEPTS: readonly PurchaseLineConcept[] = [
    "purchase",
    "royalty",
    "other",
] as const

export function isPurchaseLineConcept(value: unknown): value is PurchaseLineConcept {
    return (
        typeof value === "string" &&
        (PURCHASE_LINE_CONCEPTS as readonly string[]).includes(value)
    )
}
