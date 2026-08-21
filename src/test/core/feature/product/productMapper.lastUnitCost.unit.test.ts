import { describe, expect, it } from "vitest"
import { productFromDTO, productToDTO } from "../../../../core/feature/product/data/mapper/Mappers"
import type { ProductDTO } from "../../../../core/feature/product/data/dto/ProductDTO"

function baseDto(over: Partial<ProductDTO> = {}): ProductDTO {
    return {
        $id: "p1",
        $collectionId: "product",
        $databaseId: "db",
        $createdAt: "",
        $updatedAt: "",
        $permissions: [],
        id: "p1",
        name: "X",
        description: "",
        existence: 5,
        reserved: 1,
        price: 100,
        photo_url: "https://example.com/a.png",
        category_id: "c1",
        status: "active",
        ...over,
    } as ProductDTO
}

describe("product mapper last_unit_cost", () => {
    it("maps last_unit_cost → lastUnitCost", () => {
        const p = productFromDTO(baseDto({ last_unit_cost: 12.5 }))
        expect(p.lastUnitCost).toBe(12.5)
        const back = productToDTO(p)
        expect(back.last_unit_cost).toBe(12.5)
    })
    it("omits lastUnitCost when absent in DTO", () => {
        const p = productFromDTO(baseDto({ last_unit_cost: undefined }))
        expect(p.lastUnitCost).toBeUndefined()
    })
})
