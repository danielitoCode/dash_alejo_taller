import {infrastructureContainer} from "../../../../infrastructure/di/infrastructure.container";
import type {CategoryDTO} from "../dto/CategoryDTO";
import type {Databases, Models} from "appwrite";
import {ID} from "appwrite";
import type {ProductDTO} from "../../../product/data/dto/ProductDTO";
import type {ProductWriteDTO} from "../../../product/data/mapper/Mappers";
import type {CategoryWriteDTO} from "../mapper/Mappers";
import {logger} from "../../../../infrastructure/presentation/util/logger.service";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COLLECTION_ID = "category"

export class CategoryNetRepository {
    constructor(private readonly databases: Databases) {}

    async getAll(): Promise<CategoryDTO[]> {
        logger.info("Catgando categorias")
        const response = await this.databases.listDocuments<CategoryDTO>(
            DATABASE_ID,
            COLLECTION_ID
        )

        //logger.info(`categorias cargadas correctamente ${response.documents.toString()}`)

        return response.documents
    }

    async create(
        data: Omit<CategoryDTO, keyof Models.Document>
    ): Promise<CategoryDTO> {
        return await this.databases.createDocument<CategoryDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            data
        )
    }

    async getById(id: string): Promise<CategoryDTO> {
        return await this.databases.getDocument<CategoryDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            id
        )
    }

    async delete(id: string): Promise<void> {
        await this.databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id
        )
    }

    async update(id: string, data: Partial<CategoryWriteDTO>): Promise<CategoryDTO> {
        return await this.databases.updateDocument<CategoryDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            id,
            data
        )
    }
}