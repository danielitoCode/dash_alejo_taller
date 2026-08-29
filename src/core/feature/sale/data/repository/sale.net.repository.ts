import type { SaleDTO } from "../dto/SaleDTO"
import { type Databases, Query } from "appwrite"
import type { Models } from "appwrite"
import { ENV } from "../../../../infrastructure/env"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"
import { assertBackofficeCannotCreateB2cSale } from "../../domain/policy/BackofficeSalePolicy"

const COLLECTION_ID = "sale"
const PAGE_SIZE = 100

export type SaleListPageResult = {
    documents: SaleDTO[]
    total: number
}

export class SaleNetRepository {
    constructor(private databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID")
        return id
    }

    /**
     * Página de ventas más recientes primero ($createdAt desc).
     * Usado por el bootstrap y por el reconcile completo.
     */
    private async listPage(cursor?: string, extraQueries: string[] = []): Promise<SaleListPageResult> {
        const queries: string[] = [
            Query.orderDesc("$createdAt"),
            Query.limit(PAGE_SIZE),
            ...extraQueries,
        ]
        if (cursor) queries.push(Query.cursorAfter(cursor))

        const response = await this.databases.listDocuments<SaleDTO>(
            this.databaseId,
            COLLECTION_ID,
            queries
        )
        return { documents: response.documents, total: response.total }
    }

    /**
     * Todas las ventas, páginas hasta total. Orden: más nuevas primero.
     */
    async getAll(): Promise<SaleDTO[]> {
        const all: SaleDTO[] = []
        let cursor: string | undefined
        let reportedTotal = 0

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { documents: batch, total } = await this.listPage(cursor)
            reportedTotal = total
            if (batch.length === 0) break
            all.push(...batch)
            if (batch.length < PAGE_SIZE || all.length >= reportedTotal) break
            cursor = batch[batch.length - 1].$id
        }

        logger.log({
            scope: "sale.net.getAll",
            total: reportedTotal,
            documentsLength: all.length,
            firstDocumentId: all[0]?.$id ?? null,
        })
        return all
    }

    /** Solo total remoto (1 doc, barato) para detectar desfase del espejo. */
    async getRemoteTotal(): Promise<number> {
        const response = await this.databases.listDocuments<SaleDTO>(
            this.databaseId,
            COLLECTION_ID,
            [Query.limit(1)]
        )
        return response.total
    }

    /**
     * Incremental: documentos con $updatedAt > sinceIso (más recientes primero).
     * Appwrite no notifica borrados hard por query; eso va por Realtime delete.
     */
    async getUpdatedSince(sinceIso: string): Promise<SaleDTO[]> {
        const since = String(sinceIso || "").trim()
        if (!since) return this.getAll()

        const all: SaleDTO[] = []
        let cursor: string | undefined

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { documents: batch, total } = await this.listPage(cursor, [
                Query.greaterThan("$updatedAt", since),
            ])
            if (batch.length === 0) break
            all.push(...batch)
            if (batch.length < PAGE_SIZE || all.length >= total) break
            cursor = batch[batch.length - 1].$id
        }

        logger.log({
            scope: "sale.net.getUpdatedSince",
            since,
            documentsLength: all.length,
        })
        return all
    }

    async create(_data: Omit<SaleDTO, keyof Models.Document>): Promise<SaleDTO> {
        assertBackofficeCannotCreateB2cSale()
    }

    async getByUser(userId: string): Promise<SaleDTO[]> {
        const all: SaleDTO[] = []
        let cursor: string | undefined

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const queries: string[] = [
                Query.equal("user_id", userId),
                Query.orderDesc("$createdAt"),
                Query.limit(PAGE_SIZE),
            ]
            if (cursor) queries.push(Query.cursorAfter(cursor))

            const response = await this.databases.listDocuments<SaleDTO>(
                this.databaseId,
                COLLECTION_ID,
                queries
            )
            const batch = response.documents
            if (batch.length === 0) break
            all.push(...batch)
            if (batch.length < PAGE_SIZE || all.length >= response.total) break
            cursor = batch[batch.length - 1].$id
        }
        return all
    }

    async updateVerified(id: string, verified: string): Promise<SaleDTO> {
        return await this.databases.updateDocument<SaleDTO>(
            this.databaseId,
            COLLECTION_ID,
            id,
            { buy_state: verified }
        )
    }
}
