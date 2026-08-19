import { describe, expect, it } from "vitest"
import {
    stockMovementFromDTO,
    stockMovementToDTO,
} from "../../../../core/feature/inventory/data/mapper/Mappers"
import type { StockMovementDTO } from "../../../../core/feature/inventory/data/dto/StockMovementDTO"

function fakeDto(partial: Partial<StockMovementDTO> & { $id: string }): StockMovementDTO {
    return {
        $collectionId: "stock_movements",
        $databaseId: "db",
        $createdAt: "2026-08-18T12:00:00.000Z",
        $updatedAt: "2026-08-18T12:00:00.000Z",
        $permissions: [],
        product_id: "p1",
        type: "entrada",
        quantity: 5,
        balance_after: 20,
        reason: "compra",
        user_id: "u1",
        ...partial,
    } as unknown as StockMovementDTO
}

describe("stockMovement mapper round-trip", () => {
    it("fromDTO → toDTO preserves core fields", () => {
        const dto = fakeDto({
            $id: "m1",
            type: "salida_venta",
            sale_id: "s1",
            quantity: 2,
            balance_after: 8,
        })
        const domain = stockMovementFromDTO(dto)
        expect(domain.id).toBe("m1")
        expect(domain.productId).toBe("p1")
        expect(domain.type).toBe("salida_venta")
        expect(domain.quantity).toBe(2)
        expect(domain.balanceAfter).toBe(8)
        expect(domain.saleId).toBe("s1")

        const write = stockMovementToDTO(domain)
        expect(write.product_id).toBe("p1")
        expect(write.type).toBe("salida_venta")
        expect(write.quantity).toBe(2)
        expect(write.balance_after).toBe(8)
        expect(write.sale_id).toBe("s1")
        expect(write.user_id).toBe("u1")
    })

    it("invalid type falls back to ajuste on fromDTO", () => {
        const domain = stockMovementFromDTO(fakeDto({ $id: "m2", type: "nope" }))
        expect(domain.type).toBe("ajuste")
    })
})
