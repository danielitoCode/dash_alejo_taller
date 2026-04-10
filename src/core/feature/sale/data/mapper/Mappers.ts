import type {SaleDTO} from "../dto/SaleDTO";
import type {Sale, SaleItem} from "../../domain/entity/Sale";
import {type BuyState, DeliveryType} from "../../domain/entity/enums";
import type {SaleItemDTO} from "../dto/SaleItemDTO";

export type SaleWriteDTO = Pick<
    SaleDTO,
    "$id" | "date" | "amount" | "verified" | "products" | "user_id" | "deliveryType"
>;

function saleItemFromDTO(item: SaleItemDTO): SaleItem {
    return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
    };
}

function saleItemToDTO(item: SaleItem): SaleItemDTO {
    return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
    };
}


export function saleFromDTO(dto: SaleDTO): Sale {
    let products: any[] = [];

    try {
        if (Array.isArray(dto.products)) {
            products = dto.products;
        } else if (typeof dto.products === "string") {
            products = JSON.parse(dto.products);
        }
    } catch (e) {
        console.error("Error parsing products:", dto.products);
        products = [];
    }

    return {
        id: dto.$id,
        amount: dto.amount ?? 0,
        userId: dto.user_id ?? 0,
        date: dto.date,
        verified: dto.verified as BuyState,
        products: products.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
        }))
    };
}

/**
 * Domain → DTO (create/update payload)
 * El id de dominio se serializa en $id de Appwrite.
 */
export function saleToDTO(sale: Sale): SaleWriteDTO {
    return {
        $id: sale.id,
        date: sale.date,
        amount: sale.amount,
        verified: sale.verified,
        products: sale.products.map(saleItemToDTO),
        user_id: sale.userId,
        deliveryType: sale.deliveryType ?? null,
    };
}