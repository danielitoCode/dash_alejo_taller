import type { PromotionRepository } from "../repository/PromotionRepository"
import type { Promotion } from "../entity/Promotion"
import {
    resolvePromotionKind,
    validatePromotionForSave,
} from "../policy/PromotionPolicy"

export class GeneratePromoCaseUse {
    constructor(private readonly promoRepository: PromotionRepository) {}

    async execute(data: Promotion): Promise<void> {
        const existing = await this.promoRepository.getAll()
        const kind = resolvePromotionKind(data)
        const candidate: Promotion = {
            ...data,
            kind,
            status: data.status ?? "active",
            source: data.source ?? "manual",
            productId:
                kind === "banner" ? null : data.productId ?? null,
        }

        const errors = validatePromotionForSave(candidate, existing)
        if (errors.length > 0) {
            throw new Error(errors.map((e) => e.message).join(" · "))
        }

        await this.promoRepository.create(candidate)
    }
}
