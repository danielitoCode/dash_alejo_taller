import { type Databases, ID, Query } from "appwrite"
import { ENV } from "../../../../infrastructure/env"
import { APPWRITE_COLLECTIONS } from "../../../../infrastructure/appwrite/collections"
import type { PurchaseEntry, PurchaseEntryLine } from "../../domain/entity/PurchaseEntry"
import type { PurchaseEntryRepository } from "../../domain/repository/purchase.repository"
import type {
    PurchaseEntryDTO,
    PurchaseEntryLineDTO,
} from "../dto/PurchaseEntryDTO"
import {
    purchaseEntryFromDTO,
    purchaseEntryLineFromDTO,
    purchaseEntryLineToDTO,
    purchaseEntryToDTO,
} from "../mapper/Mappers"

export class PurchaseEntryNetRepository implements PurchaseEntryRepository {
    constructor(private readonly databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID")
        return id
    }

    async createEntry(entry: PurchaseEntry): Promise<PurchaseEntry> {
        const write = purchaseEntryToDTO(entry)
        const { $id, ...data } = write
        const doc = await this.databases.createDocument<PurchaseEntryDTO>(
            this.databaseId,
            APPWRITE_COLLECTIONS.purchaseEntry,
            $id && $id.length > 0 ? $id : ID.unique(),
            data as Omit<PurchaseEntryDTO, keyof import("appwrite").Models.Document>
        )
        return purchaseEntryFromDTO(doc)
    }

    async createLine(line: PurchaseEntryLine): Promise<PurchaseEntryLine> {
        const write = purchaseEntryLineToDTO(line)
        const { $id, ...data } = write
        const doc = await this.databases.createDocument<PurchaseEntryLineDTO>(
            this.databaseId,
            APPWRITE_COLLECTIONS.purchaseEntryLine,
            $id && $id.length > 0 ? $id : ID.unique(),
            data as Omit<PurchaseEntryLineDTO, keyof import("appwrite").Models.Document>
        )
        return purchaseEntryLineFromDTO(doc)
    }

    async getEntryById(id: string): Promise<PurchaseEntry | null> {
        try {
            const doc = await this.databases.getDocument<PurchaseEntryDTO>(
                this.databaseId,
                APPWRITE_COLLECTIONS.purchaseEntry,
                id
            )
            return purchaseEntryFromDTO(doc)
        } catch {
            return null
        }
    }

    async listEntries(limit = 50): Promise<PurchaseEntry[]> {
        const res = await this.databases.listDocuments<PurchaseEntryDTO>(
            this.databaseId,
            APPWRITE_COLLECTIONS.purchaseEntry,
            [
                Query.orderDesc("entry_date"),
                Query.limit(Math.min(Math.max(1, limit), 100)),
            ]
        )
        return res.documents.map(purchaseEntryFromDTO)
    }

    async listLinesByEntry(entryId: string): Promise<PurchaseEntryLine[]> {
        const eid = String(entryId || "").trim()
        if (!eid) return []
        const res = await this.databases.listDocuments<PurchaseEntryLineDTO>(
            this.databaseId,
            APPWRITE_COLLECTIONS.purchaseEntryLine,
            [Query.equal("entry_id", eid), Query.limit(100)]
        )
        return res.documents.map(purchaseEntryLineFromDTO)
    }
}
