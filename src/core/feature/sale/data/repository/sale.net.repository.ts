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
        try {
            const response = await this.databases.listDocuments<SaleDTO>(
                this.databaseId,
                COLLECTION_ID
            )

            logger.log({
                scope: "sale.net.getAll",
                total: response.total,
                documentsLength: response.documents.length,
                firstDocumentId: response.documents[0]?.$id ?? null
            })

            return response.documents
        } catch (error: any) {
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
        try {
            const response = await this.databases.listDocuments<SaleDTO>(
                this.databaseId,
                COLLECTION_ID,
                [Query.equal("user_id", userId)]
            )

            return response.documents
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
