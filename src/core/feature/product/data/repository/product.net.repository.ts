
import type {ProductDTO} from "../dto/ProductDTO";
import {type Databases, ID, Query} from "appwrite";
import type {ProductWriteDTO} from "../mapper/Mappers";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COLLECTION_ID = "product"

class ProductNetRepository {
    constructor(private readonly databases: Databases ) {
    }

    async getAll(): Promise<ProductDTO[]> {
        console.log("Sincronizando datos desde el repositorio de productos");
        const response = await this.databases.listDocuments<ProductDTO>(
            DATABASE_ID,
            COLLECTION_ID
        )

        return response.documents
    }

    async getById(id: string): Promise<ProductDTO> {
        return await this.databases.getDocument<ProductDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            id
        )
    }

    async update(id: string, data: Partial<ProductWriteDTO>): Promise<ProductDTO> {
        return await this.databases.updateDocument<ProductDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            id,
            data
        )
    }

    async getByCategory(categoryId: string): Promise<ProductDTO[]> {
        const response = await this.databases.listDocuments<ProductDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal("categoryId", categoryId)]
        )

        return response.documents
    }

    async create(product: ProductWriteDTO): Promise<ProductDTO> {
        return await this.databases.createDocument<ProductDTO>(
            DATABASE_ID,
            COLLECTION_ID,
            product.$id || ID.unique(),
            product as ProductDTO
        )
    }

    async delete(id: string): Promise<void> {
        await this.databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id
        )
    }
}

export default ProductNetRepository