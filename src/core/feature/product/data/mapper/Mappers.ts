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
    | "last_unit_cost"
    | "price_protected_at"
    | "price_protection_entry_id"
>

/** Payload de catálogo sin tocar soft-hold (no envía reserved). */
export type ProductCatalogWriteDTO = Omit<ProductWriteDTO, "reserved">

/**
 * DTO → Domain.
 * reserved ausente o inválido → 0 (docs legacy).
 */
function toNonNegNumber(value: unknown, fallback = 0): number {
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0) return fallback
    return n
}

export function productFromDTO(dto: ProductDTO): Product {
    const rawCost = dto.last_unit_cost
    const lastUnitCost =
        rawCost === undefined || rawCost === null
            ? undefined
            : toNonNegNumber(rawCost, 0)

    const priceProtectedAt =
        dto.price_protected_at != null && String(dto.price_protected_at).trim() !== ""
            ? String(dto.price_protected_at).trim()
            : undefined
    const priceProtectionEntryId =
        dto.price_protection_entry_id != null &&
        String(dto.price_protection_entry_id).trim() !== ""
            ? String(dto.price_protection_entry_id).trim()
            : undefined

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
        lastUnitCost,
        priceProtectedAt,
        priceProtectionEntryId,
    }
}

/**
 * Domain → DTO completo (create o sync que debe reflejar reserved).
 */
export function productToDTO(product: Product): ProductWriteDTO {
    const dto: ProductWriteDTO = {
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
    if (product.lastUnitCost !== undefined && product.lastUnitCost !== null) {
        dto.last_unit_cost = toNonNegNumber(product.lastUnitCost, 0)
    }
    if (product.priceProtectedAt) {
        dto.price_protected_at = product.priceProtectedAt
    }
    if (product.priceProtectionEntryId) {
        dto.price_protection_entry_id = product.priceProtectionEntryId
    }
    return dto
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
