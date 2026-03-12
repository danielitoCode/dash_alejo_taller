import {PromotionNetRepository} from "./promotion.net.repository";
import type {PromotionRepository} from "../../domain/repository/PromotionRepository";
import type {Promotion} from "../../domain/entity/Promotion";
import {db} from "../../../../infrastructure/di/dexie.db";
import {promotionFromDTO, promotionToDTO} from "../mapper/Mappers";

export class PromotionOfflineFirstRepository implements PromotionRepository {
    constructor(private readonly net: PromotionNetRepository) {}

    async create(promotion: Promotion): Promise<void> {
        try {
            const created = await this.net.create(promotionToDTO(promotion))
            await db.promotions.put(created)
        } catch {
            const localDTO = promotionToDTO(promotion)
            await db.promotions.put({
                id: "",
                ...localDTO,
                $collectionId: "",
                $databaseId: "",
                $createdAt: new Date().toISOString(),
                $updatedAt: new Date().toISOString(),
                $permissions: [],
                $sequence: 0
            })
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.net.delete(id)
        } finally {
            await db.promotions.delete(id)
        }
    }

    async getAll(): Promise<Promotion[]> {
        try {
            const remote = await this.net.getAll()
            await db.promotions.bulkPut(remote)
            return remote.map(promotionFromDTO)
        } catch {
            const local = await db.promotions.toArray()
            return local.map(promotionFromDTO)
        }
    }

    async getActive(now: number): Promise<Promotion[]> {
        try {
            const remote = await this.net.getActive(now)
            await db.promotions.bulkPut(remote)
            return remote.map(promotionFromDTO)
        } catch {
            const local = await db.promotions
                .filter((it) => it.validFromEpochMillis <= now && it.validUntilEpochMillis >= now)
                .toArray()
            return local.map(promotionFromDTO)
        }
    }

    async sync(): Promise<void> {
        const remote = await this.net.getAll()
        await db.promotions.clear()
        await db.promotions.bulkPut(remote)
    }
}