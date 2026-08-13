import type { Models } from "appwrite"

export interface SupplierDTO extends Models.Document {
    name: string
    contact?: string
    notes?: string
}
