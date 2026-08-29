import type { SaleDTO } from "../dto/SaleDTO";
import { type Databases, Query } from "appwrite";
import type { Models } from "appwrite";
import { ENV } from "../../../../infrastructure/env";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";
import { assertBackofficeCannotCreateB2cSale } from "../../domain/policy/BackofficeSalePolicy";

const COLLECTION_ID = "sale";
/** Appwrite default page size is 25; must page until all.length === total. */
const PAGE_SIZE = 100;

export class SaleNetRepository {
    constructor(private databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId;
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID");
        return id;
    }

    /**
     * Lista TODAS las ventas (paginado). Sin esto, con >25 documentos Appwrite
     * solo devuelve la primera página y las intenciones nuevas no aparecen.
     */
    async getAll(): Promise<SaleDTO[]> {
        try {
            const all: SaleDTO[] = [];
            let cursor: string | undefined;
            let reportedTotal = 0;
            let page = 0;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                page += 1;
                const queries: string[] = [
                    Query.orderDesc("$createdAt"),
                    Query.limit(PAGE_SIZE),
                ];
                if (cursor) queries.push(Query.cursorAfter(cursor));

                const response = await this.databases.listDocuments<SaleDTO>(
                    this.databaseId,
                    COLLECTION_ID,
                    queries
                );

                reportedTotal = response.total;
                const batch = response.documents;
                if (batch.length === 0) break;

                all.push(...batch);

                logger.log({
                    scope: "sale.net.getAll.page",
                    page,
                    batchLength: batch.length,
                    accumulated: all.length,
                    total: reportedTotal,
                });

                if (batch.length < PAGE_SIZE || all.length >= reportedTotal) break;
                cursor = batch[batch.length - 1].$id;
            }

            if (reportedTotal > 0 && all.length < reportedTotal) {
                logger.warn(
                    `[sale.net.getAll] incomplete fetch: got ${all.length} of ${reportedTotal}`
                );
            }

            logger.log({
                scope: "sale.net.getAll",
                total: reportedTotal,
                documentsLength: all.length,
                firstDocumentId: all[0]?.$id ?? null,
            });

            return all;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Core1 4.4: bloqueado. Alta B2C solo en clientes de tienda.
     */
    async create(
        _data: Omit<SaleDTO, keyof Models.Document>
    ): Promise<SaleDTO> {
        assertBackofficeCannotCreateB2cSale();
    }

    async getByUser(userId: string): Promise<SaleDTO[]> {
        try {
            const all: SaleDTO[] = [];
            let cursor: string | undefined;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const queries: string[] = [
                    Query.equal("user_id", userId),
                    Query.orderDesc("$createdAt"),
                    Query.limit(PAGE_SIZE),
                ];
                if (cursor) queries.push(Query.cursorAfter(cursor));

                const response = await this.databases.listDocuments<SaleDTO>(
                    this.databaseId,
                    COLLECTION_ID,
                    queries
                );

                const batch = response.documents;
                if (batch.length === 0) break;
                all.push(...batch);
                if (batch.length < PAGE_SIZE || all.length >= response.total) break;
                cursor = batch[batch.length - 1].$id;
            }

            return all;
        } catch (error: any) {
            throw error;
        }
    }

    async updateVerified(id: string, verified: string): Promise<SaleDTO> {
        return await this.databases.updateDocument<SaleDTO>(
            this.databaseId,
            COLLECTION_ID,
            id,
            { buy_state: verified }
        );
    }
}
