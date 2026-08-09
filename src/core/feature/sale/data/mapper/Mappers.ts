import type { SaleDTO } from "../dto/SaleDTO"
import type { Sale, SaleItem } from "../../domain/entity/Sale"
import { BuyState, DeliveryType } from "../../domain/entity/enums"
import type { SaleItemDTO } from "../dto/SaleItemDTO"

export type SaleWriteDTO = Pick<
    SaleDTO,
    "$id" | "date" | "amount" | "currency" | "buy_state" | "products" | "user_id" | "delivery_type"
>

function saleItemToDTO(item: SaleItem): SaleItemDTO {
    return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
    }
}

function normalizeBuyState(raw: unknown): BuyState {
    const s = String(raw ?? "").toUpperCase()
    if (s === BuyState.VERIFIED) return BuyState.VERIFIED
    if (s === BuyState.DELETED) return BuyState.DELETED
    return BuyState.UNVERIFIED
}

function normalizeDelivery(raw: unknown): DeliveryType | null {
    if (raw == null || raw === "") return null
    const s = String(raw).toUpperCase()
    if (s === DeliveryType.PICKUP) return DeliveryType.PICKUP
    if (s === DeliveryType.DELIVERY) return DeliveryType.DELIVERY
    return null
}

export function saleFromDTO(dto: SaleDTO): Sale {
    let products: any[] = []
    const verified = normalizeBuyState(dto.verified ?? dto.buy_state)
    const deliveryType = normalizeDelivery(dto.deliveryType ?? dto.delivery_type)

    try {
        if (Array.isArray(dto.products)) {
            products = dto.products
        } else if (typeof dto.products === "string") {
            products = JSON.parse(dto.products)
        }
    } catch {
        products = []
    }

    const currency =
        typeof dto.currency === "string" && dto.currency.trim()
            ? dto.currency.trim().toUpperCase()
            : null

    return {
        id: dto.$id,
        amount: Number(dto.amount) || 0,
        currency,
        userId: dto.user_id ?? "",
        date: dto.date,
        verified,
        products: products.map((item) => ({
            productId: String(item?.productId ?? item?.product_id ?? ""),
            quantity: Number(item?.quantity) || 0,
            price: Number(item?.price) || 0,
        })),
        deliveryType,
        createdAtIso: dto.$createdAt,
        updatedAtIso: dto.$updatedAt,
    }
}

export function saleToDTO(sale: Sale): SaleWriteDTO {
    return {
        $id: sale.id,
        date: sale.date,
        amount: sale.amount,
        currency: sale.currency ?? null,
        buy_state: sale.verified,
        products: sale.products.map(saleItemToDTO),
        user_id: sale.userId,
        delivery_type: sale.deliveryType ?? null,
    }
}
