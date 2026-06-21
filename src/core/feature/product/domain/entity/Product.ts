export type ProductStatus = "active" | "inactive"

export interface Product {
    id: string
    name: string
    description: string
    price: number
    photoUrl: string
    categoryId: string
    status: ProductStatus
    rating?: number
    createdAtIso?: string
}

/**
 * Factory con validaciones (equivalente al init{})
 */
export function createProduct(product: Product): Product {
    if (!product.id || product.id.trim() === "") {
        throw new Error("The value of product identifier cannot be empty")
    }

    if (product.price < 0) {
        throw new Error("The price cannot be negative")
    }

    return {
        rating: 0.0,
        ...product
    }
}

function isValidProductImageUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "data:" || url.protocol === "blob:";
    } catch {
        return false;
    }
}

function collectStrings(value: unknown): string[] {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap(collectStrings);
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        return collectStrings(record.url ?? record.src ?? record.href);
    }
    return [];
}

export function parseProductImages(photoUrl: string): string[] {
    const input = photoUrl.trim();
    if (!input) return [];

    let candidates: string[] = [];
    try {
        candidates = collectStrings(JSON.parse(input));
    } catch {
        candidates = input.split(/[\n,;|]+/);
    }

    return candidates.map((candidate) => candidate.trim()).filter(isValidProductImageUrl);
}

export function getPrimaryProductImage(photoUrl: string): string {
    return parseProductImages(photoUrl)[0] ?? "";
}