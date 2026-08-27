import type { Models } from "appwrite"

/**
 * DTO Appwrite `supplier`.
 * En el proyecto real `contact` es required en consola (puede ser "").
 */
export interface SupplierDTO extends Models.Document {
    name: string
    contact: string
    notes?: string | null
}
