import type {PromotionDTO} from "../dto/PromotionDTO";
import type {Promotion} from "../../domain/entity/Promotion";

export type PromotionWriteDTO = Pick<
    PromotionDTO,
    | "$id"
    | "productId"
    | "title"
    | "message"
    | "imageUrl"
    | "oldPrice"
    | "currentPrice"
    | "validFromEpochMillis"
    | "validUntilEpochMillis"
    | "source"
>;

export function promotionFromDTO(dto: PromotionDTO): Promotion {
    return {
        id: dto.$id,
        productId: dto.productId ?? null,
        title: dto.title,
        message: dto.message,
        imageUrl: dto.imageUrl ?? null,
        oldPrice: dto.oldPrice ?? null,
        currentPrice: dto.currentPrice ?? null,
        validFromEpochMillis: dto.validFromEpochMillis,
        validUntilEpochMillis: dto.validUntilEpochMillis,
        source: dto.source === "manual" ? "manual" : "automatic",
    };
}

/**
 * Domain → DTO (create/update payload)
 * El id de dominio se serializa en $id de Appwrite.
 */
export function promotionToDTO(promotion: Promotion): PromotionWriteDTO {
    return {
        $id: promotion.id,
        productId: promotion.productId ?? null,
        title: promotion.title,
        message: promotion.message,
        imageUrl: promotion.imageUrl ?? null,
        oldPrice: promotion.oldPrice ?? null,
        currentPrice: promotion.currentPrice ?? null,
        validFromEpochMillis: promotion.validFromEpochMillis,
        validUntilEpochMillis: promotion.validUntilEpochMillis,
        source: promotion.source ?? "automatic",
    };
}
