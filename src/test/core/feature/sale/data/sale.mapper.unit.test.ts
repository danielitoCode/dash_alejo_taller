import { describe, it, expect } from "vitest"
import { saleFromDTO } from "../../../../../core/feature/sale/data/mapper/Mappers"
import type { SaleDTO } from "../../../../../core/feature/sale/data/dto/SaleDTO"
import { BuyState, DeliveryType } from "../../../../../core/feature/sale/domain/entity/enums"

function dto(overrides: Partial<SaleDTO> = {}): SaleDTO {
    return {
        $id: "sale-1",
        $createdAt: "2026-08-01T10:00:00.000Z",
        $updatedAt: "2026-08-01T11:00:00.000Z",
        $permissions: [],
        $collectionId: "sale",
        $databaseId: "db",
        date: "2026-08-01T09:30:00.000Z",
        amount: 25.5,
        currency: "cup",
        buy_state: "UNVERIFIED",
        products: [{ productId: "p-1", quantity: 2, price: 10 }],
        user_id: "user-9",
        delivery_type: "PICKUP",
        ...overrides,
    } as SaleDTO
}

describe("saleFromDTO (Core1 4.2 detalle)", () => {
    it("mapea líneas, userId, fechas, currency y delivery", () => {
        const s = saleFromDTO(dto())
        expect(s.id).toBe("sale-1")
        expect(s.userId).toBe("user-9")
        expect(s.amount).toBe(25.5)
        expect(s.currency).toBe("CUP")
        expect(s.verified).toBe(BuyState.UNVERIFIED)
        expect(s.deliveryType).toBe(DeliveryType.PICKUP)
        expect(s.createdAtIso).toBe("2026-08-01T10:00:00.000Z")
        expect(s.updatedAtIso).toBe("2026-08-01T11:00:00.000Z")
        expect(s.products).toEqual([{ productId: "p-1", quantity: 2, price: 10 }])
    })

    it("currency ausente → null (no inventa USD)", () => {
        const s = saleFromDTO(dto({ currency: undefined }))
        expect(s.currency).toBeNull()
    })

    it("products como JSON string", () => {
        const s = saleFromDTO(
            dto({
                products: JSON.stringify([
                    { productId: "p-2", quantity: 1, price: 3 },
                ]) as unknown as SaleDTO["products"],
            })
        )
        expect(s.products[0].productId).toBe("p-2")
    })
})
