import Dexie, { type Table } from "dexie"
import type { ProductDTO } from "../../feature/product/data/dto/ProductDTO"
import type { CategoryDTO } from "../../feature/category/data/dto/CategoryDTO"
import type { PromotionDTO } from "../../feature/notification/data/dto/PromotionDTO"
import type { SaleDTO } from "../../feature/sale/data/dto/SaleDTO"

export type SyncMetaRow = {
    key: string
    /** ISO timestamp of last successful full reconcile */
    lastFullSyncAt?: string
    /** ISO timestamp watermark for incremental $updatedAt queries */
    lastIncrementalAt?: string
    /** Last known Appwrite total for the collection */
    remoteTotal?: number
}

class AppDatabase extends Dexie {
    products!: Table<ProductDTO>
    categories!: Table<CategoryDTO>
    promotions!: Table<PromotionDTO>
    sales!: Table<SaleDTO>
    syncMeta!: Table<SyncMetaRow>

    constructor() {
        super("alejo-taller-business-db")

        this.version(1).stores({
            products: "$id, name, categoryId",
            categories: "$id, name",
            promotions: "$id, validUntilEpochMillis",
            sales: "$id, userId, verified",
        })

        this.version(2).stores({
            products: "$id, name, category_id, status",
            categories: "$id, name, status",
            promotions: "$id, productId, validUntilEpochMillis, source",
            sales: "$id, userId, verified",
        })

        // v3: sync metadata for incremental / full reconcile of offline mirrors
        this.version(3).stores({
            products: "$id, name, category_id, status",
            categories: "$id, name, status",
            promotions: "$id, productId, validUntilEpochMillis, source",
            sales: "$id, user_id, buy_state, $updatedAt",
            syncMeta: "key",
        })
    }
}

export const db = new AppDatabase()
