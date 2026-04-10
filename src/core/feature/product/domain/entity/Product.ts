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
    photoLocalResource?: number | null
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
        ...product
        status: product.status ?? "active",
        rating: product.rating ?? 0.0,
    }
}
