import type { ProductDTO } from "../dto/ProductDTO";
import { type Databases, ID, Query } from "appwrite";
import type { ProductWriteDTO } from "../mapper/Mappers";
import { ENV } from "../../../../infrastructure/env";
import {
    clampNonNegative,
    nextStockAfterConfirm,
    nextStockAfterReject,
} from "../../../sale/domain/policy/StockDecisionMath";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

const COLLECTION_ID = "product";

class ProductNetRepository {
    constructor(private readonly databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId;
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID");
        return id;
    }

    async getAll(limit: number = 25, offset: number = 0): Promise<{ documents: ProductDTO[]; total: number }> {
        const response = await this.databases.listDocuments<ProductDTO>(
            this.databaseId,
            COLLECTION_ID,
            [
                Query.orderDesc("$createdAt"),
                Query.limit(limit),
                Query.offset(offset),
            ]
        );

        return { documents: response.documents, total: response.total };
    }

    async getById(id: string): Promise<ProductDTO> {
        return await this.databases.getDocument<ProductDTO>(
            this.databaseId,
            COLLECTION_ID,
            id
        );
    }

    async update(id: string, data: Partial<ProductWriteDTO>): Promise<ProductDTO> {
        return await this.databases.updateDocument<ProductDTO>(
            this.databaseId,
            COLLECTION_ID,
            id,
            data
        );
    }

    /**
     * Paridad con `AppwriteOperatorStockRepository.applyDeltas`:
     * re-read remoto → clamp → update existence/reserved.
     * Autoridad: Appwrite (no Dexie).
     */
    async applyStockDeltas(
        productId: string,
        opts: { confirmed: boolean; qty: number }
    ): Promise<{ existence: number; reserved: number }> {
        const doc = await this.getById(productId);
        const currentExistence = clampNonNegative((doc as any).existence ?? 0);
        const currentReserved = clampNonNegative((doc as any).reserved ?? 0);
        const qty = clampNonNegative(opts.qty);

        const next = opts.confirmed
            ? nextStockAfterConfirm(currentExistence, currentReserved, qty)
            : nextStockAfterReject(currentExistence, currentReserved, qty);

        if (opts.confirmed && currentExistence < qty) {
            logger.warn(
                `[stock] confirm clamp productId=${productId} existence=${currentExistence} qty=${qty} → ${next.existence}`
            );
        }

        await this.databases.updateDocument<ProductDTO>(
            this.databaseId,
            COLLECTION_ID,
            productId,
            {
                existence: next.existence,
                reserved: next.reserved,
            } as Partial<ProductDTO>
        );

        logger.info(
            `[stock] apply productId=${productId} confirmed=${opts.confirmed} qty=${qty} ` +
                `existence ${currentExistence}→${next.existence} reserved ${currentReserved}→${next.reserved}`
        );

        return next;
    }

    async getByCategory(categoryId: string): Promise<ProductDTO[]> {
        const response = await this.databases.listDocuments<ProductDTO>(
            this.databaseId,
            COLLECTION_ID,
            [Query.equal("category_id", categoryId)]
        );

        return response.documents;
    }

    async create(product: ProductWriteDTO): Promise<ProductDTO> {
        return await this.databases.createDocument<ProductDTO>(
            this.databaseId,
            COLLECTION_ID,
            product.$id || ID.unique(),
            product as ProductDTO
        );
    }

    async delete(id: string): Promise<void> {
        await this.databases.deleteDocument(this.databaseId, COLLECTION_ID, id);
    }
}

export default ProductNetRepository;
