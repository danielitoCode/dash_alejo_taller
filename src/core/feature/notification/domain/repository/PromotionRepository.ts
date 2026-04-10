import type {Promotion} from "../entity/Promotion";

export interface PromotionRepository {
    create(promotion: Promotion): Promise<void>

    getAll(): Promise<Promotion[]>

    getActive(now: number): Promise<Promotion[]>

    delete(id: string): Promise<void>
}
