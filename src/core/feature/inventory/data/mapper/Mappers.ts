import type { StockMovement } from "../../domain/entity/StockMovement"
import { createStockMovement } from "../../domain/entity/StockMovement"
import { isStockMovementType } from "../../domain/entity/enums"
import type { StockMovementDTO } from "../dto/StockMovementDTO"

function toPosInt(value: unknown, fallback = 1): number {
    const n = Math.trunc(Number(value))
    if (!Number.isFinite(n) || n <= 0) return fallback
    return n
}

function toNonNegInt(value: unknown, fallback = 0): number {
    const n = Math.trunc(Number(value))
    if (!Number.isFinite(n) || n < 0) return fallback
    return n
}

export type StockMovementWriteDTO = Pick<
    StockMovementDTO,
    | "product_id"
    | "type"
    | "quantity"
    | "balance_after"
    | "reason"
    | "user_id"
    | "sale_id"
    | "entry_id"
    | "created_at_iso"
> & { $id?: string }

export function stockMovementFromDTO(dto: StockMovementDTO): StockMovement {
    const type = isStockMovementType(dto.type) ? dto.type : "ajuste"
    return createStockMovement({
        id: dto.$id,
        productId: dto.product_id,
        type,
        quantity: toPosInt(dto.quantity, 1),
        balanceAfter: toNonNegInt(dto.balance_after, 0),
        reason: dto.reason ?? "",
        userId: dto.user_id ?? "",
        saleId: dto.sale_id,
        entryId: dto.entry_id,
        createdAtIso: dto.created_at_iso ?? dto.$createdAt,
    })
}

export function stockMovementToDTO(m: StockMovement): StockMovementWriteDTO {
    const dto: StockMovementWriteDTO = {
        $id: m.id,
        product_id: m.productId,
        type: m.type,
        quantity: m.quantity,
        balance_after: m.balanceAfter,
        reason: m.reason,
        user_id: m.userId,
    }
    if (m.saleId) dto.sale_id = m.saleId
    if (m.entryId) dto.entry_id = m.entryId
    if (m.createdAtIso) dto.created_at_iso = m.createdAtIso
    return dto
}
