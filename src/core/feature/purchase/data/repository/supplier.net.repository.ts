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
        const { $id, ...data } = write
        const doc = await this.databases.createDocument<SupplierDTO>(
            this.databaseId,
            this.collectionId,
            $id && $id.length > 0 ? $id : ID.unique(),
            data as Omit<SupplierDTO, keyof import("appwrite").Models.Document>
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
        const res = await this.databases.listDocuments<SupplierDTO>(
            this.databaseId,
            this.collectionId,
            [Query.orderAsc("name"), Query.limit(Math.min(Math.max(1, limit), 100))]
        )
        return res.documents.map(supplierFromDTO)
    }

    async update(id: string, patch: Partial<Supplier>): Promise<Supplier> {
        const data: Record<string, unknown> = {}
        if (patch.name !== undefined) data.name = patch.name
        if (patch.contact !== undefined) data.contact = patch.contact
        if (patch.notes !== undefined) data.notes = patch.notes
        const doc = await this.databases.updateDocument<SupplierDTO>(
            this.databaseId,
            this.collectionId,
            id,
            data
        )
        return supplierFromDTO(doc)
    }
}
