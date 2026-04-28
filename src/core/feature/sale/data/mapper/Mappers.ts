import type {SaleDTO} from "../dto/SaleDTO";
import type {Sale, SaleItem} from "../../domain/entity/Sale";
import {type BuyState, DeliveryType} from "../../domain/entity/enums";
import type {SaleItemDTO} from "../dto/SaleItemDTO";

export type SaleWriteDTO = Pick<
    SaleDTO,
    "$id" | "date" | "amount" | "buy_state" | "products" | "user_id" | "delivery_type"
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
    const verified = dto.verified ?? dto.buy_state ?? BuyState.UNVERIFIED;
    const deliveryType = dto.deliveryType ?? dto.delivery_type ?? null;

    console.info("[sale-debug][step 5][mapper.saleFromDTO] raw dto", {
        id: dto.$id,
        amount: dto.amount,
        verified: dto.verified,
        buy_state: dto.buy_state,
        deliveryType: dto.deliveryType,
        delivery_type: dto.delivery_type,
        user_id: dto.user_id,
        productsType: typeof dto.products,
        productsPreview: dto.products
    });

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

    const sale = {
        id: dto.$id,
        amount: dto.amount ?? 0,
        userId: dto.user_id ?? "",
        date: dto.date,
        verified: verified as BuyState,
        products: products.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
        })),
        deliveryType: deliveryType as DeliveryType | null
    };

    console.info("[sale-debug][step 5b][mapper.saleFromDTO] mapped sale", sale);

    return sale;
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
        buy_state: sale.verified,
        products: sale.products.map(saleItemToDTO),
        user_id: sale.userId,
        delivery_type: sale.deliveryType ?? null,
    };
}
