import { type Databases, ID, Query } from "appwrite"
import { ENV } from "../../../../infrastructure/env"
import { APPWRITE_COLLECTIONS } from "../../../../infrastructure/appwrite/collections"
import type { SaleFinanceEvent } from "../../domain/entity/SaleFinanceEvent"
import type { SaleFinanceRepository } from "../../domain/repository/sale-finance.repository"
import type { SaleFinanceEventDTO } from "../dto/SaleFinanceEventDTO"
import {
    saleFinanceEventFromDTO,
    saleFinanceEventToDTO,
} from "../mapper/Mappers"

/**
 * Net repo — sale_finance_event.
 * create: si ya existe por sale_id, devuelve el existente (idempotencia best-effort).
 */
export class SaleFinanceNetRepository implements SaleFinanceRepository {
    constructor(private readonly databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID")
        return id
    }

    private get collectionId(): string {
        return APPWRITE_COLLECTIONS.saleFinanceEvent
    }

    async getBySaleId(saleId: string): Promise<SaleFinanceEvent | null> {
        const sid = String(saleId || "").trim()
        if (!sid) return null
        const res = await this.databases.listDocuments<SaleFinanceEventDTO>(
            this.databaseId,
            this.collectionId,
            [Query.equal("sale_id", sid), Query.limit(1)]
        )
        const doc = res.documents[0]
        return doc ? saleFinanceEventFromDTO(doc) : null
    }

    async create(event: SaleFinanceEvent): Promise<SaleFinanceEvent> {
        const existing = await this.getBySaleId(event.saleId)
        if (existing) return existing

        const write = saleFinanceEventToDTO(event)
        const { $id, ...data } = write
        const doc = await this.databases.createDocument<SaleFinanceEventDTO>(
            this.databaseId,
            this.collectionId,
            $id && $id.length > 0 ? $id : ID.unique(),
            data as Omit<SaleFinanceEventDTO, keyof import("appwrite").Models.Document>
        )
        return saleFinanceEventFromDTO(doc)
    }

    async listByDateRange(
        fromIso: string,
        toIso: string,
        limit = 100
    ): Promise<SaleFinanceEvent[]> {
        const res = await this.databases.listDocuments<SaleFinanceEventDTO>(
            this.databaseId,
            this.collectionId,
            [
                Query.greaterThanEqual("at", fromIso),
                Query.lessThanEqual("at", toIso),
                Query.orderDesc("at"),
                Query.limit(Math.min(Math.max(1, limit), 100)),
            ]
        )
        return res.documents.map(saleFinanceEventFromDTO)
    }
}
