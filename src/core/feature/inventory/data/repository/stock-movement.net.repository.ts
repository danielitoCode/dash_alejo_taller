import { type Databases, ID, Query } from "appwrite"
import { ENV } from "../../../../infrastructure/env"
import { APPWRITE_COLLECTIONS } from "../../../../infrastructure/appwrite/collections"
import type { StockMovement } from "../../domain/entity/StockMovement"
import type { StockMovementType } from "../../domain/entity/enums"
import type { StockMovementRepository } from "../../domain/repository/stock-movement.repository"
import type { StockMovementDTO } from "../dto/StockMovementDTO"
import {
    stockMovementFromDTO,
    stockMovementToDTO,
} from "../mapper/Mappers"

/**
 * Net repo Appwrite — stock_movements (append-only).
 */
export class StockMovementNetRepository implements StockMovementRepository {
    constructor(private readonly databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID")
        return id
    }

    private get collectionId(): string {
        return APPWRITE_COLLECTIONS.stockMovements
    }

    async create(movement: StockMovement): Promise<StockMovement> {
        const write = stockMovementToDTO(movement)
        const { $id, ...data } = write
        const doc = await this.databases.createDocument<StockMovementDTO>(
            this.databaseId,
            this.collectionId,
            $id && $id.length > 0 ? $id : ID.unique(),
            data as Omit<StockMovementDTO, keyof import("appwrite").Models.Document>
        )
        return stockMovementFromDTO(doc)
    }

    async listByProduct(productId: string, limit = 50): Promise<StockMovement[]> {
        const pid = String(productId || "").trim()
        if (!pid) return []
        const res = await this.databases.listDocuments<StockMovementDTO>(
            this.databaseId,
            this.collectionId,
            [
                Query.equal("product_id", pid),
                Query.orderDesc("$createdAt"),
                Query.limit(Math.min(Math.max(1, limit), 100)),
            ]
        )
        return res.documents.map(stockMovementFromDTO)
    }

    async listRecent(limit = 50, type?: StockMovementType): Promise<StockMovement[]> {
        const queries = [
            Query.orderDesc("$createdAt"),
            Query.limit(Math.min(Math.max(1, limit), 100)),
        ]
        if (type) queries.unshift(Query.equal("type", type))
        const res = await this.databases.listDocuments<StockMovementDTO>(
            this.databaseId,
            this.collectionId,
            queries
        )
        return res.documents.map(stockMovementFromDTO)
    }

    async listByEntry(entryId: string, limit = 100): Promise<StockMovement[]> {
        const eid = String(entryId || "").trim()
        if (!eid) return []
        const res = await this.databases.listDocuments<StockMovementDTO>(
            this.databaseId,
            this.collectionId,
            [
                Query.equal("entry_id", eid),
                Query.orderDesc("$createdAt"),
                Query.limit(Math.min(Math.max(1, limit), 100)),
            ]
        )
        return res.documents.map(stockMovementFromDTO)
    }
}
