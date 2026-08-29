import type { SaleDTO } from "../dto/SaleDTO";
import { type Databases, ID, Query } from "appwrite";
import type { Models } from "appwrite";
import { ENV } from "../../../../infrastructure/env";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";
import { assertBackofficeCannotCreateB2cSale } from "../../domain/policy/BackofficeSalePolicy";

const COLLECTION_ID = "sale";
/** Appwrite default page size is 25; without pagination total can be > documents.length. */
const PAGE_SIZE = 100;

export class SaleNetRepository {
    constructor(private databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId;
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID");
        return id;
    }

    /**
     * Lista todas las ventas (paginado). Sin esto, con >25 documentos Appwrite
     * solo devuelve la primera página y las intenciones nuevas no aparecen en el panel.
     */
    async getAll(): Promise<SaleDTO[]> {
        try {
            const all: SaleDTO[] = [];
            let cursor: string | undefined;
            let reportedTotal = 0;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const queries = [
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
                if (batch.length < PAGE_SIZE || all.length >= reportedTotal) break;

                cursor = batch[batch.length - 1].$id;
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
     * Firma conservada por compatibilidad; no ejecuta createDocument.
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
                const queries = [
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
