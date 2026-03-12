import {infrastructureContainer} from "../../../../infrastructure/di/infrastructure.container";
import type {PromotionDTO} from "../dto/PromotionDTO";
import {type Databases, ID, Query} from "appwrite";
import type {ProductWriteDTO} from "../../../product/data/mapper/Mappers";
import type {ProductDTO} from "../../../product/data/dto/ProductDTO";
import type {PromotionWriteDTO} from "../mapper/Mappers";
import type {PromotionRepository} from "../../domain/repository/PromotionRepository";


const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COLLECTION_ID = "promotions"

export class PromotionNetRepository {
    constructor(private readonly databases: Databases) {}

    async getAll(): Promise<PromotionDTO[]> {
        const response = await this.databases.listDocuments<PromotionDTO>(
            DATABASE_ID,
            COLLECTION_ID
        )

        return response.documents
    }

    async create(promo: PromotionWriteDTO): Promise<PromotionDTO> {
        return await this.databases.createDocument<PromotionDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            promo.$id || ID.unique(),
            promo as PromotionDTO
        )
    }

    async delete(id: string): Promise<void> {
        await this.databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id
        )
    }

    async getActive(now: number): Promise<PromotionDTO[]> {
        const response = await this.databases.listDocuments<PromotionDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.lessThanEqual("validFromEpochMillis", now),
                Query.greaterThanEqual("validUntilEpochMillis", now)
            ]
        )

        return response.documents
    }
}