import {infrastructureContainer} from "../../../../infrastructure/di/infrastructure.container";
import type {SaleDTO} from "../dto/SaleDTO";
import {type Databases, ID, Query} from "appwrite";
import type {Models} from "appwrite"
import type {ProductDTO} from "../../../product/data/dto/ProductDTO";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COLLECTION_ID = "sales"

export class SaleNetRepository {
    constructor(private databases: Databases) {}

    async getAll(): Promise<SaleDTO[]> {
        const response = await this.databases.listDocuments<SaleDTO>(
            DATABASE_ID,
            COLLECTION_ID
        )

        return response.documents
    }

    async create(
        data: Omit<SaleDTO, keyof Models.Document>
    ): Promise<SaleDTO> {
        return await this.databases.createDocument<SaleDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            data
        )
    }

    async getByUser(userId: string): Promise<SaleDTO[]> {
        const response = await this.databases.listDocuments<SaleDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal("userId", userId)]
        )

        return response.documents
    }
}