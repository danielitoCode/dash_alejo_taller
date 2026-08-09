import type { ProductDTO } from "../dto/ProductDTO"
import type { Product } from "../../domain/entity/Product"

function toNonNegInt(value: unknown, fallback = 0): number {
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0) return fallback
    return Math.floor(n)
}

/**
 * Campos que el panel puede escribir en create/update de catálogo.
 * `reserved` se incluye en create (0) y en re-read/write completo;
 * en updates de catálogo preferir no pisarlo: ver productToCatalogWriteDTO.
 */
export type ProductWriteDTO = Pick<
    ProductDTO,
    | "$id"
    | "name"
    | "description"
    | "price"
    | "photo_url"
    | "category_id"
    | "status"
    | "rating"
    | "existence"
    | "reserved"
>

/** Payload de catálogo sin tocar soft-hold (no envía reserved). */
export type ProductCatalogWriteDTO = Omit<ProductWriteDTO, "reserved">

/**
 * DTO → Domain.
 * reserved ausente o inválido → 0 (docs legacy).
 */
export function productFromDTO(dto: ProductDTO): Product {
    return {
        id: dto.$id,
        name: dto.name,
        description: dto.description,
        existence: toNonNegInt(dto.existence, 0),
        reserved: toNonNegInt(dto.reserved, 0),
        price: dto.price,
        photoUrl: dto.photo_url,
        categoryId: dto.category_id,
        status: dto.status === "inactive" ? "inactive" : "active",
        rating: dto.rating ?? 0,
    }
}

/**
 * Domain → DTO completo (create o sync que debe reflejar reserved).
 */
export function productToDTO(product: Product): ProductWriteDTO {
    return {
        $id: product.id,
        name: product.name,
        description: product.description,
        existence: toNonNegInt(product.existence, 0),
        reserved: toNonNegInt(product.reserved, 0),
        price: product.price,
        photo_url: product.photoUrl,
        category_id: product.categoryId,
        status: product.status,
        rating: product.rating,
    }
}

/**
 * Domain → payload de catálogo: no incluye `reserved` para no sobrescribir
 * holds activos en Appwrite al editar nombre/precio/existence desde el panel.
 */
export function productToCatalogWriteDTO(product: Product): ProductCatalogWriteDTO {
    const full = productToDTO(product)
    const { reserved: _r, ...catalog } = full
    return catalog
}
