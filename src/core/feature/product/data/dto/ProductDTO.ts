import type { Models } from "appwrite"

/**
 * Documento Appwrite `product`.
 * `reserved` existe en el esquema compartido con la tienda (soft-hold).
 */
export interface ProductDTO extends Models.Document {
    id: string
    name: string
    description: string
    existence: number
    /** Soft-hold; puede faltar en docs antiguos → mapper usa 0. */
    reserved?: number
    price: number
    photo_url: string
    category_id: string
    status?: string
    rating?: number
    /** Core 2 — último costo; ausente en docs Core 1 → mapper 0/undefined */
    last_unit_cost?: number
    /** Core 3 — protección de precio (gap Appwrite hasta migrar). */
    price_protected_at?: string
    price_protection_entry_id?: string
}
