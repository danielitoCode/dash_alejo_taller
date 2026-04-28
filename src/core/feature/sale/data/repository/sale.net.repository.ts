import type { SaleDTO } from "../dto/SaleDTO";
import { type Databases, ID, Query } from "appwrite";
import type { Models } from "appwrite";
import { ENV } from "../../../../infrastructure/env";
import {logger} from "../../../../infrastructure/presentation/util/logger.service";

const COLLECTION_ID = "sale";

export class SaleNetRepository {
    constructor(private databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId;
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID");
        return id;
    }

    async getAll(): Promise<SaleDTO[]> {
        console.info("[sale-debug][step 1][sale.net.getAll] requesting documents", {
            databaseId: this.databaseId,
            collectionId: COLLECTION_ID
        });

        try {
            const response = await this.databases.listDocuments<SaleDTO>(
                this.databaseId,
                COLLECTION_ID
            )

            console.info("[sale-debug][step 2][sale.net.getAll] response received", {
                total: response.total,
                documentsLength: response.documents.length,
                firstDocument: response.documents[0] ?? null
            });

            logger.log(`Error while sync sales from storage ${response.documents}`)

            return response.documents
        } catch (error: any) {
            console.error("[sale-debug][step 2][sale.net.getAll] request failed", {
                message: error?.message ?? String(error),
                code: error?.code,
                type: error?.type,
                response: error
            });
            throw error;
        }
    }

    async create(
        data: Omit<SaleDTO, keyof Models.Document>
    ): Promise<SaleDTO> {
        return await this.databases.createDocument<SaleDTO>(
            this.databaseId,
            COLLECTION_ID,
            ID.unique(),
            data
        )
    }

    async getByUser(userId: string): Promise<SaleDTO[]> {
        console.info("[sale-debug][step 1b][sale.net.getByUser] requesting user documents", {
            databaseId: this.databaseId,
            collectionId: COLLECTION_ID,
            userId
        });

        try {
            const response = await this.databases.listDocuments<SaleDTO>(
                this.databaseId,
                COLLECTION_ID,
                [Query.equal("user_id", userId)]
            )

            console.info("[sale-debug][step 2b][sale.net.getByUser] response received", {
                total: response.total,
                documentsLength: response.documents.length,
                firstDocument: response.documents[0] ?? null
            });

            return response.documents
        } catch (error: any) {
            console.error("[sale-debug][step 2b][sale.net.getByUser] request failed", {
                userId,
                message: error?.message ?? String(error),
                code: error?.code,
                type: error?.type,
                response: error
            });
            throw error;
        }
    }

    async updateVerified(id: string, verified: string): Promise<SaleDTO> {
        console.debug("[sale-debug][net.updateVerified] updating", { id, verified });
        return await this.databases.updateDocument<SaleDTO>(
            this.databaseId,
            COLLECTION_ID,
            id,
            { buy_state: verified }
        );
    }
}
