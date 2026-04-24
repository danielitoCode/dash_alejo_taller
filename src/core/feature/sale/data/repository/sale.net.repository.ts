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
        console.debug("[sale-debug][net.getAll] requesting documents", {
            databaseId: this.databaseId,
            collectionId: COLLECTION_ID
        });

        const response = await this.databases.listDocuments<SaleDTO>(
            this.databaseId,
            COLLECTION_ID
        )

        console.debug("[sale-debug][net.getAll] response", {
            total: response.total,
            documentsLength: response.documents.length,
            firstDocument: response.documents[0] ?? null
        });

        logger.log(`Error while sync sales from storage ${response.documents}`)

        return response.documents
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
        console.debug("[sale-debug][net.getByUser] requesting user documents", {
            databaseId: this.databaseId,
            collectionId: COLLECTION_ID,
            userId
        });

        const response = await this.databases.listDocuments<SaleDTO>(
            this.databaseId,
            COLLECTION_ID,
            [Query.equal("user_id", userId)]
        )

        console.debug("[sale-debug][net.getByUser] response", {
            total: response.total,
            documentsLength: response.documents.length,
            firstDocument: response.documents[0] ?? null
        });

        return response.documents
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
