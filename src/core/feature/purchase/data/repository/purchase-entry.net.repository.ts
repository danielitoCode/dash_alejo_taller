import { type Databases, ID, Query } from "appwrite"
import { ENV } from "../../../../infrastructure/env"
import { APPWRITE_COLLECTIONS } from "../../../../infrastructure/appwrite/collections"
import type { PurchaseEntry, PurchaseEntryLine } from "../../domain/entity/PurchaseEntry"
import type {
    ListPurchaseEntriesOpts,
    PurchaseEntryRepository,
} from "../../domain/repository/purchase.repository"
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

    async listEntries(limitOrOpts: number | ListPurchaseEntriesOpts = 50): Promise<PurchaseEntry[]> {
        const opts: ListPurchaseEntriesOpts =
            typeof limitOrOpts === "number" ? { limit: limitOrOpts } : limitOrOpts ?? {}
        const limit = Math.min(Math.max(1, opts.limit ?? 50), 100)
        const queries = [Query.orderDesc("entry_date"), Query.limit(limit)]
        const sid = String(opts.supplierId || "").trim()
        if (sid) queries.unshift(Query.equal("supplier_id", sid))

        const res = await this.databases.listDocuments<PurchaseEntryDTO>(
            this.databaseId,
            APPWRITE_COLLECTIONS.purchaseEntry,
            queries
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

    async listLinesByProduct(productId: string, limit = 50): Promise<PurchaseEntryLine[]> {
        const pid = String(productId || "").trim()
        if (!pid) return []
        const res = await this.databases.listDocuments<PurchaseEntryLineDTO>(
            this.databaseId,
            APPWRITE_COLLECTIONS.purchaseEntryLine,
            [
                Query.equal("product_id", pid),
                Query.orderDesc("$createdAt"),
                Query.limit(Math.min(Math.max(1, limit), 100)),
            ]
        )
        return res.documents.map(purchaseEntryLineFromDTO)
    }
}
