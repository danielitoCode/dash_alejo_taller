import { type Databases, ID, Query } from "appwrite"
import { ENV } from "../../../../infrastructure/env"
import { APPWRITE_COLLECTIONS } from "../../../../infrastructure/appwrite/collections"
import type { Supplier } from "../../domain/entity/Supplier"
import type { SupplierRepository } from "../../domain/repository/purchase.repository"
import type { SupplierDTO } from "../dto/SupplierDTO"
import { supplierFromDTO, supplierToDTO } from "../mapper/Mappers"

export class SupplierNetRepository implements SupplierRepository {
    constructor(private readonly databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID")
        return id
    }

    private get collectionId(): string {
        return APPWRITE_COLLECTIONS.supplier
    }

    async create(supplier: Supplier): Promise<Supplier> {
        const write = supplierToDTO(supplier)
        const id = write.$id && write.$id.length > 0 ? write.$id : ID.unique()
        // Payload sin $id: solo atributos de collection (contact siempre string).
        const data: {
            name: string
            contact: string
            notes?: string
        } = {
            name: write.name,
            contact: write.contact,
        }
        if (write.notes !== undefined) {
            data.notes = write.notes
        }
        const doc = await this.databases.createDocument<SupplierDTO>(
            this.databaseId,
            this.collectionId,
            id,
            data
        )
        return supplierFromDTO(doc)
    }

    async getById(id: string): Promise<Supplier | null> {
        try {
            const doc = await this.databases.getDocument<SupplierDTO>(
                this.databaseId,
                this.collectionId,
                id
            )
            return supplierFromDTO(doc)
        } catch {
            return null
        }
    }

    async list(limit = 50): Promise<Supplier[]> {
        const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 50), 100)
        const res = await this.databases.listDocuments<SupplierDTO>(
            this.databaseId,
            this.collectionId,
            [Query.orderAsc("name"), Query.limit(safeLimit)]
        )
        return res.documents.map(supplierFromDTO)
    }

    async update(id: string, patch: Partial<Supplier>): Promise<Supplier> {
        const data: {
            name?: string
            contact?: string
            notes?: string
        } = {}
        if (patch.name !== undefined) {
            data.name = String(patch.name).trim()
        }
        if (patch.contact !== undefined) {
            // Required en Appwrite: nunca enviar null; vacío → "".
            data.contact =
                patch.contact != null && String(patch.contact).trim() !== ""
                    ? String(patch.contact).trim()
                    : ""
        }
        if (patch.notes !== undefined) {
            data.notes =
                patch.notes != null && String(patch.notes).trim() !== ""
                    ? String(patch.notes).trim()
                    : ""
        }
        const doc = await this.databases.updateDocument<SupplierDTO>(
            this.databaseId,
            this.collectionId,
            id,
            data
        )
        return supplierFromDTO(doc)
    }
}
