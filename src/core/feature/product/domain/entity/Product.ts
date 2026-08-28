export type ProductStatus = "active" | "inactive"

/**
 * Dominio Product alineado a AlejoTaller Core 1 / CANONICAL_RULES_FREEZE.
 * - existence: unidades físicas
 * - reserved: soft-hold (pedidos UNVERIFIED); no editable a mano en panel Core 1
 * - available = max(0, existence - reserved)
 * - lastUnitCost: Core 2 — último costo de compra (base COGS) siempre USD
 * - price: siempre USD; puede auto-subir por protección de compra (EXCHANGE_POLICY §5)
 */
export interface Product {
    id: string
    name: string
    description: string
    existence: number
    /** Unidades comprometidas en soft-hold. Solo muta por hold/release/consume de ventas. */
    reserved: number
    price: number
    photoUrl: string
    categoryId: string
    status: ProductStatus
    rating?: number
    createdAtIso?: string
    /**
     * Core 2 — último costo unitario de compra (base COGS).
     * undefined/0 si nunca hubo entrada con costo. Siempre USD.
     */
    lastUnitCost?: number
    /**
     * Core 3 — cuándo se auto-ajustó el precio por protección (costo > precio).
     * Opcional hasta existir atributo en Appwrite.
     */
    priceProtectedAt?: string
    /** Traza a purchase_entry que disparó la protección. */
    priceProtectionEntryId?: string
}

/** available = max(0, existence − reserved) — misma fórmula que tienda y operador. */
export function availableStock(product: Pick<Product, "existence" | "reserved">): number {
    const existence = Number(product.existence) || 0
    const reserved = Number(product.reserved) || 0
    return Math.max(0, existence - reserved)
}

/**
 * Factory con validaciones de dominio (Core 1 + lastUnitCost Core 2 + protección Core 3).
 */
export function createProduct(product: Product): Product {
    if (!product.id || product.id.trim() === "") {
        throw new Error("The value of product identifier cannot be empty")
    }

    if (product.price < 0) {
        throw new Error("The price cannot be negative")
    }

    const existence = Number(product.existence)
    const reserved = Number(product.reserved)

    if (!Number.isFinite(existence) || existence < 0) {
        throw new Error("existence must be a number >= 0")
    }

    if (!Number.isFinite(reserved) || reserved < 0) {
        throw new Error("reserved must be a number >= 0")
    }

    if (existence < reserved) {
        throw new Error("existence cannot be less than reserved")
    }

    let lastUnitCost = product.lastUnitCost
    if (lastUnitCost !== undefined && lastUnitCost !== null) {
        const c = Number(lastUnitCost)
        if (!Number.isFinite(c) || c < 0) {
            throw new Error("lastUnitCost must be a number >= 0")
        }
        lastUnitCost = c
    }

    const priceProtectedAt = product.priceProtectedAt
        ? String(product.priceProtectedAt).trim() || undefined
        : undefined
    const priceProtectionEntryId = product.priceProtectionEntryId
        ? String(product.priceProtectionEntryId).trim() || undefined
        : undefined

    return {
        rating: 0.0,
        ...product,
        existence,
        reserved,
        lastUnitCost,
        priceProtectedAt,
        priceProtectionEntryId,
    }
}

function isValidProductImageUrl(value: string): boolean {
    try {
        const url = new URL(value)
        return (
            url.protocol === "http:" ||
            url.protocol === "https:" ||
            url.protocol === "data:" ||
            url.protocol === "blob:"
        )
    } catch {
        return false
    }
}

function collectStrings(value: unknown): string[] {
    if (typeof value === "string") return [value]
    if (Array.isArray(value)) return value.flatMap(collectStrings)
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>
        return collectStrings(record.url ?? record.src ?? record.href)
    }
    return []
}

export function parseProductImages(photoUrl: string): string[] {
    const input = photoUrl.trim()
    if (!input) return []

    let candidates: string[] = []
    try {
        candidates = collectStrings(JSON.parse(input))
    } catch {
        candidates = input.split(/[\n,;|]+/)
    }

    return candidates.map((candidate) => candidate.trim()).filter(isValidProductImageUrl)
}

export function getPrimaryProductImage(photoUrl: string): string {
    return parseProductImages(photoUrl)[0] ?? ""
}
